<template>
  <div class="standings-page">
    <header>
      <h1>BATTLE OF SNIPERS</h1>
      <h2>SEASON 7</h2>
      <p>{{ verified ? "LIVE TOURNAMENT STANDINGS" : "PLAYER VERIFICATION" }}</p>
    </header>

    <!-- Step 1: Verify FF UID -->
    <section v-if="!verified" class="standings-card">
      <h3>Verify Your FF UID</h3>
      <p>Enter your registered Free Fire UID to continue.</p>

      <form @submit.prevent="verifyUid">
        <input v-model="ffUid" type="text" inputmode="numeric" maxlength="20" placeholder="Enter Free Fire UID" autocomplete="off" required 
        @input="ffUid = ffUid.replace(/[^0-9]/g, '')" />

        <button type="submit" :disabled="loading">
          {{ loading ? "VERIFYING..." : "VERIFY & VIEW STANDINGS" }}
        </button>
      </form>

      <p v-if="message" class="error-message"> {{ message }} </p>
    </section>

    <!-- Step 2: Show only after successful verification -->
    <section v-else class="standings-card">
      <button class="page-back-btn" @click="goBack"> ← Back </button>
      <h3>UID Verified Successfully!</h3>

      <div class="player-details">
        <p><strong>Player:</strong> {{ playerName }}</p>
        <p><strong>FF UID:</strong> {{ verifiedUid }}</p>
        <p><strong>Team:</strong> {{ teamName }}</p>
      </div>
      
      <div class="results-placeholder">
        <h3>TOURNAMENT TEAMS</h3>
        <p v-if="groupsLoading">Loading teams...</p>
        <p v-if="groupsError" class="error-message"> {{ groupsError }} </p>
        <div class="groups-container">
          <div class="group-card">
            <h4>GROUP A</h4>
            <div v-if="groups.A.length === 0 && !groupsLoading"> 
              No teams assigned yet. 
            </div>
            <div v-for="(team, index) in groups.A" :key="team._id" class="team-row">
              <span class="team-number">{{ index + 1 }}.</span>
              <img v-if="team.teamLogo" :src="team.teamLogo" :alt="team.teamName + ' logo'" class="team-logo"/>
              <span>{{ team.teamName }}</span>
            </div>
          </div>
          <div class="group-card">
            <h4>GROUP B</h4>
            <div v-if="groups.B.length === 0 && !groupsLoading">
              No teams assigned yet.
            </div>
            <div v-for="(team, index) in groups.B" :key="team._id" class="team-row">
              <span class="team-number">{{ index + 1 }}.</span>
              <img v-if="team.teamLogo" :src="team.teamLogo" :alt="team.teamName + ' logo'" class="team-logo"/>
              <span>{{ team.teamName }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="points-section">
        <h3>LIVE POINTS TABLE</h3>
        <p v-if="pointsLoading">Updating points...</p>
        <p v-if="pointsError" class="error-message"> {{ pointsError }} </p>
        <div v-for="groupName in ['A', 'B']" :key="groupName" class="points-group">
          <h4>GROUP {{ groupName }}</h4>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Logo</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Round Pts</th>
                  <th>Total Pts</th>
                  <th>Status</th>
                </tr>
              </thead>
              
              <tbody>
                <tr v-for="(team, index) in pointsGroups[groupName]" :key="team.registrationId || team._id || index">
                  <td>{{ index + 1 }}</td>
                  <td class="logo-cell">
                    <img v-if="team.teamLogo" :src="team.teamLogo" :alt="team.teamName + ' logo'" class="points-team-logo"/>
                    <span v-else class="no-logo">—</span>
                  </td>
                  <td>{{ team.teamName }}</td>
                  <td>{{ (team.won || 0) + (team.lost || 0) }}</td>
                  <td>{{ team.won || 0 }}</td>
                  <td>{{ team.lost || 0 }}</td>
                  <td>{{ team.roundsPoints || 0 }}</td>
                  <td class="total-points"> 
                    {{ team.totalPoints || 0 }}
                  </td>
                  <td>
  <span
    v-if="team.qualificationStatus === 'Q'"
    class="qualification-badge qualified"
  >
    Q
  </span>

  <span
    v-else-if="team.qualificationStatus === 'E'"
    class="qualification-badge eliminated"
  >
    E
  </span>

  <span v-else>—</span>
</td>
                </tr>
                <tr v-if="pointsGroups[groupName].length === 0">
                  <td colspan="9">No teams in this group yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "LiveStandings",

  data() {
    return {
      ffUid: "",
      verified: false,
      loading: false,
      message: "",
      verifiedUid: "",
      playerName: "",
      teamName: "",
      groups: {
        A: [],
        B: []
      },
      groupsLoading: false,
      groupsError: "",
      pointsGroups: {
        A: [],
        B: []
      },
      pointsLoading: false,
      pointsError: "",
      pointsInterval: null
    };
  },

  beforeUnmount() {
    if (this.pointsInterval) {
      clearInterval(this.pointsInterval);
    }
  },

  methods: {
    async loadGroups() {
      this.groupsLoading = true;
      this.groupsError = "";
      
      try {
        const response = await fetch(
          "https://battle-of-snipers.onrender.com/api/standings/teams",
          {
            cache: "no-store"
          }
        );
       
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || "Could not load teams."
          );
        }
        
        this.groups = {
          A: result.groups?.A || [],
          B: result.groups?.B || []
        };
      } catch (error) {
        this.groupsError = error.message || "Unable to load teams.";
      } finally {
        this.groupsLoading = false;
      }
    },
    
    async loadPointsTable() {
      this.pointsLoading = true;
      this.pointsError = "";
      
      try {
        const response = await fetch(
          "https://battle-of-snipers.onrender.com/api/standings/points",
          { cache: "no-store" }
        );
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || "Could not load points table."
          );
        }

        this.pointsGroups = {
          A: result.groups?.A || [],
          B: result.groups?.B || []
        };
      } catch (error) {
        this.pointsError =
        error.message || "Unable to load points table.";
      } finally {
        this.pointsLoading = false;
      }
    },

    async verifyUid() {
      if (this.loading) return;

      this.loading = true;
      this.message = "";
      this.verified = false;

      try {
        const response = await fetch(
          "https://battle-of-snipers.onrender.com/api/verify-ff-uid",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ffUid: this.ffUid.trim()
            })
          }
        );

        const result = await response.json();

        if (!response.ok || !result.verified) {
          throw new Error(
            result.message || "FF UID verification failed."
          );
        }

        this.verifiedUid = result.ffUid;
        this.playerName = result.ffName;
        this.teamName = result.teamName;
        this.verified = true;
        this.loadGroups();
        this.loadPointsTable();
        
        if (this.pointsInterval) {
          clearInterval(this.pointsInterval);
        }
        
        this.pointsInterval = setInterval(() => {
          if (this.verified) {
            this.loadPointsTable();
          }
        }, 5000);
      } catch (error) {
        this.message = error.message || "Unable to verify UID. Try again.";
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      this.resetVerification();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    resetVerification() {
      this.ffUid = "";
      this.verified = false;
      this.message = "";
      this.verifiedUid = "";
      this.playerName = "";
      this.teamName = "";
      if (this.pointsInterval) {
        clearInterval(this.pointsInterval);
        this.pointsInterval = null;
      }
    }
  }
};
</script>

<style scoped>
.standings-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 20px;
  background: #0b0b0f;
  color: #fff;
  font-family: Arial, sans-serif;
  text-align: center;
}

.standings-page header h1 {
  color: #ffb000;
  overflow-wrap: anywhere;
}

.standings-page header h2 {
  margin-bottom: 8px;
}

.standings-page header p {
  color: #ccc;
  letter-spacing: 1px;
}

.standings-card {
  width: 100%;
  max-width: 700px;
  margin: 40px auto;
  padding: 30px 20px;
  background: #17171e;
  border: 1px solid #38333a;
  border-radius: 14px;
}

.standings-card input {
  display: block;
  width: 100%;
  max-width: 420px;
  margin: 22px auto 12px;
  padding: 14px;
  border: 1px solid #383844;
  border-radius: 9px;
  background: #0e0e13;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.standings-card input:focus {
  border-color: #ffb000;
}

.standings-card button {
  width: 100%;
  max-width: 420px;
  padding: 14px;
  border: none;
  border-radius: 9px;
  background: #ffb000;
  color: #111;
  font-weight: 800;
  cursor: pointer;
}

.standings-card button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.error-message {
  margin-top: 18px;
  color: #ff7777;
}

.player-details {
  margin: 24px auto;
  padding: 16px;
  background: #0e0e13;
  border-radius: 10px;
  text-align: left;
  overflow-wrap: anywhere;
}

.results-placeholder {
  margin-top: 25px;
  padding: 20px;
  background: #0e0e13;
  border-radius: 10px;
}

.groups-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
  text-align: left;
}

.group-card {
  min-width: 0;
  padding: 16px;
  background: #17171e;
  border: 1px solid #383844;
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.group-card h4 {
  margin-top: 0;
  color: #ffb000;
  text-align: center;
}

.team-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 0;
  border-bottom: 1px solid #383844;
}

.team-number {
  color: #ffb000;
  flex-shrink: 0;
}

.team-logo {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .groups-container {
    grid-template-columns: 1fr;
  }
}

.points-section {
  margin-top: 25px;
  padding: 20px;
  background: #0e0e13;
  border-radius: 10px;
  text-align: left;
}

.points-section > h3,
.points-group h4 {
  color: #ffb000;
  text-align: center;
}

.points-group {
  margin-top: 24px;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.table-scroll table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-size: 13px;
}

.table-scroll th,
.table-scroll td {
  padding: 12px 9px;
  border-bottom: 1px solid #383844;
  text-align: center;
  white-space: nowrap;
}

.table-scroll th {
  color: #ffb000;
  background: #17171e;
}

.table-scroll td:nth-child(2),
.table-scroll th:nth-child(2) {
  text-align: left;
}

.total-points {
  color: #ffb000;
  font-weight: 800;
}


.logo-cell {
  width: 58px;
  text-align: center !important;
}

.points-team-logo {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #ffb000;
  vertical-align: middle;
  display: inline-block;
}

.team-name-cell {
  text-align: left !important;
  font-weight: 600;
}

.standings-page header {
  position: relative;
}

.page-back-btn {
  position: absolute;
  top: 30px;
  right: 6%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto !important;
  max-width: none !important;
  margin: 0;
  padding: 14px 20px !important;
  background: #111217 !important;
  color: #f2f2f2 !important;
  border: 1px solid #383844 !important;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.page-back-btn:hover {
  background: #1b1c22 !important;
  border-color: #ffb000 !important;
  color: #ffb000 !important;
}

@media (max-width: 600px) {
  .page-back-btn {
    top: 10px;
    right: 0;
    padding: 10px 12px !important;
    font-size: 13px;
  }

  .standings-page header {
    padding-top: 55px;
  }
}

.qualification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  padding: 5px 9px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 13px;
}

.qualification-badge.qualified {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.45);
}

.qualification-badge.eliminated {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.45);
}

</style>
