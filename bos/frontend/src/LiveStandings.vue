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
      <div v-if="seasonView === 'dashboard'">
        <button class="page-back-btn" @click="goBack"> ← Back </button>
        <h3>UID Verified Successfully!</h3>

        <div class="player-details">
          <p><strong>Player:</strong> {{ playerName }}</p>
          <p><strong>FF UID:</strong> {{ verifiedUid }}</p>
          <p><strong>Team:</strong> {{ teamName }}</p>
        </div>
      
        <div class="scheduled-matches-section">
          <h2>Scheduled Matches</h2>
          <p v-if="scheduledMatchesLoading"> Loading scheduled matches... </p>
          <p v-else-if="scheduledMatchesError" class="error-message"> {{ scheduledMatchesError }} </p>
          <p v-else-if="scheduledMatches.length === 0"> No scheduled matches available yet. </p>
          <div v-else class="scheduled-matches-list">
            <div v-for="match in scheduledMatches" :key="match._id" class="scheduled-match-card">
              <div class="scheduled-match-header">
                <span>Group {{ match.group }}</span>
                <span>{{ new Date(match.matchDate).toLocaleString() }}</span>
              </div>
              <div class="scheduled-match-teams">
                <strong>{{ match.team1Name }}</strong>
                <span>VS</span>
                <strong>{{ match.team2Name }}</strong>
              </div>
              <p class="scheduled-match-assigned"> Assigned to: {{ match.assignedTo }} </p>
            </div>
          </div>
        </div>

        
<!-- PAST SEASONS BUTTON ON DASHBOARD -->
<div class="past-seasons-entry">
  <button
    type="button"
    class="past-seasons-button"
    @click="openSeasonsPage"
  >
    <span class="past-seasons-icon">🏆</span>
    <span>
      <strong>PAST SEASONS</strong>
      <small>View completed tournaments</small>
    </span>
    <span class="past-seasons-arrow">→</span>
  </button>
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
                    <td class="total-points"> {{ team.totalPoints || 0 }} </td>
                    <td>
                      <span  v-if="team.qualificationStatus === 'Q'" class="qualification-badge qualified"> Q </span>
                      <span v-else-if="team.qualificationStatus === 'E'" class="qualification-badge eliminated"> E </span>
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
      </div>
      
<!-- SEASONS LIST PAGE -->
<div v-else-if="seasonView === 'seasons'" class="season-page">
  <button
    type="button"
    class="season-back-button"
    @click="backToDashboard"
  >
    ← Back to Dashboard
  </button>

  <h2>🏆 PAST SEASONS</h2>
  <p class="season-page-subtitle">
    Select a completed season to view its results.
  </p>

  <p v-if="seasonsLoading">Loading seasons...</p>

  <p v-else-if="seasonsError" class="error-message">
    {{ seasonsError }}
  </p>

  <p v-else-if="seasons.length === 0">
    No completed seasons available yet.
  </p>

  <div v-else class="seasons-grid">
    <button
      v-for="season in seasons"
      :key="season._id || season.seasonNumber"
      type="button"
      class="season-card"
      @click="openSeason(season.seasonNumber)"
    >
      <span class="season-card-label">BATTLE OF SNIPERS</span>
      <strong>{{ season.title }}</strong>
      <span class="season-card-status">{{ season.status }}</span>
      <span class="season-card-action">VIEW SEASON →</span>
    </button>
  </div>
</div>

<!-- SELECTED SEASON DETAILS PAGE -->
<div v-else-if="seasonView === 'details'" class="season-page">
  <button
    type="button"
    class="season-back-button"
    @click="backToSeasons"
  >
    ← Back to Seasons
  </button>

<button
  type="button"
  class="season-back-button"
  @click="openSeasonMatches"
>
  Matches →
</button>

  <template v-if="selectedSeason">
    <h2>{{ selectedSeason.title }}</h2>
    <p class="season-page-subtitle">Final Standings</p>
  </template>

  <p v-if="seasonDetailsLoading">Loading season details...</p>

  <p v-else-if="seasonDetailsError" class="error-message">
    {{ seasonDetailsError }}
  </p>

  <div
    v-else-if="selectedSeason"
    class="season-table-scroll"
  >
    <table class="season-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Matches</th>
          <th>Wins</th>
          <th>Loss</th>
          <th>Points</th>
          <th>Damage</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="team in selectedSeason.standings"
          :key="team.rank"
        >
          <td>{{ team.rank }}</td>
          <td>{{ team.name }}</td>
          <td>{{ team.matches }}</td>
          <td>{{ team.wins }}</td>
          <td>{{ team.losses }}</td>
          <td>{{ team.points }}</td>
          <td>{{ Number(team.damage || 0).toLocaleString('en-IN') }}</td>
        </tr>

        <tr v-if="!selectedSeason.standings?.length">
          <td colspan="7">No standings available for this season.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- SEASON MATCHES PAGE -->
<div v-else-if="seasonView === 'matches'" class="season-page">
  <button
    type="button"
    class="season-back-button"
    @click="backToSeasonDetails"
  >
    ← Back to Season 1
  </button>

  <h2>{{ selectedSeason ? selectedSeason.title : "Season Matches" }} — Matches</h2>

  <p class="season-page-subtitle">
    All matches from this season.
  </p>

  <div v-if="!selectedSeason">
    <p>Season details are not loaded.</p>
  </div>

  <div v-else-if="!selectedSeason.matches || selectedSeason.matches.length === 0">
    <p>No matches added yet. Match schedules will appear here.</p>
  </div>

  <div v-else class="season-matches-list">
    <div
      v-for="(match, index) in selectedSeason.matches"
      :key="match._id || match.matchNumber || index"
      class="season-match-card"
    >
      <h3>Match {{ match.matchNumber || index + 1 }}</h3>
      <p v-if="match.date"><strong>Date:</strong> {{ match.date }}</p>
      <p v-if="match.time"><strong>Time:</strong> {{ match.time }}</p>
      <p v-if="match.group"><strong>Group:</strong> {{ match.group }}</p>
      <p v-if="match.teams"><strong>Teams:</strong> {{ match.teams }}</p>
      <p v-if="match.winner"><strong>Winner: </strong><span class="winner-text">{{ match.winner }}</span></p>
      <p v-if="match.loser"><strong>Loser: </strong><span class="loser-text">{{ match.loser }}</span></p>
      <p v-if="match.schedule"><strong>Schedule:</strong> {{ match.schedule }}</p>
    </div>
  </div>
</div>

    </section>
  </div>
</template>

<script>
const API_BASE_URL = "https://battle-of-snipers.onrender.com";
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
      pointsInterval: null,
      scheduledMatches: [],
      scheduledMatchesLoading: false,
      scheduledMatchesError: "",
      seasons: [],
      seasonsLoading: false,
      seasonsError: "",
      selectedSeason: null,
      selectedSeasonNumber: null,
      seasonDetailsLoading: false,
      seasonDetailsError: "",
      seasonView: "dashboard"
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

    
async loadScheduledMatches() {
  this.scheduledMatchesLoading = true;
  this.scheduledMatchesError = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/scheduled-matches/for-player",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ffUid: this.verifiedUid
        }),
        cache: "no-store"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Could not load scheduled matches."
      );
    }

    this.scheduledMatches = result.scheduledMatches || [];
  } catch (error) {
    this.scheduledMatchesError =
      error.message || "Unable to load scheduled matches.";
  } finally {
    this.scheduledMatchesLoading = false;
  }
},


async loadSeasons() {
  this.seasonsLoading = true;
  this.seasonsError = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/seasons`, {
      cache: "no-store"
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not load seasons.");
    }

    this.seasons = result.seasons || [];
  } catch (error) {
    this.seasonsError = error.message || "Unable to load seasons.";
  } finally {
    this.seasonsLoading = false;
  }
},

async openSeason(seasonNumber) {
  this.selectedSeasonNumber = seasonNumber;
  this.seasonView = "details";
  this.selectedSeason = null;
  this.seasonDetailsLoading = true;
  this.seasonDetailsError = "";

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/seasons/${seasonNumber}`,
      { cache: "no-store" }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not load season.");
    }

    this.selectedSeason = result.season;
  } catch (error) {
    this.seasonDetailsError =
      error.message || "Unable to load season details.";
  } finally {
    this.seasonDetailsLoading = false;
  }
},


openSeasonsPage() {
  this.selectedSeason = null;
  this.selectedSeasonNumber = null;
  this.seasonView = "seasons";

  if (this.seasons.length === 0) {
    this.loadSeasons();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
},

backToDashboard() {
  this.seasonView = "dashboard";
  window.scrollTo({ top: 0, behavior: "smooth" });
},

backToSeasons() {
  this.selectedSeason = null;
  this.selectedSeasonNumber = null;
  this.seasonView = "seasons";
  window.scrollTo({ top: 0, behavior: "smooth" });
},


openSeasonMatches() {
  this.seasonView = "matches";
  window.scrollTo({ top: 0, behavior: "smooth" });
},

backToSeasonDetails() {
  this.seasonView = "details";
  window.scrollTo({ top: 0, behavior: "smooth" });
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
        this.loadScheduledMatches();
        this.loadSeasons();
        
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
      this.scheduledMatches = [];
      this.scheduledMatchesLoading = false;
      this.scheduledMatchesError = "";
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


.scheduled-matches-section {
  margin-top: 28px;
  padding: 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.scheduled-matches-section h2 {
  margin: 0 0 18px;
  color: #ffcc00;
  font-size: 22px;
}

.scheduled-matches-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.scheduled-match-card {
  padding: 16px;
  border-radius: 12px;
  background: rgba(15, 20, 32, 0.8);
  border: 1px solid rgba(255, 204, 0, 0.3);
}

.scheduled-match-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  color: #ffcc00;
  font-size: 13px;
}

.scheduled-match-teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 22px 0;
  color: #ffffff;
}

.scheduled-match-teams span {
  color: #ff5252;
  font-weight: 800;
}

.scheduled-match-assigned {
  margin: 0;
  color: #b8c0ce;
  font-size: 13px;
}

.scheduled-matches-section p {
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .scheduled-matches-section {
    padding: 14px;
  }

  .scheduled-match-teams {
    gap: 6px;
    font-size: 13px;
  }
}


/* Historical seasons */
.seasons-section {
  margin-top: 28px;
  padding: 22px;
  border-radius: 14px;
  background: #0e0e13;
  border: 1px solid #383844;
  text-align: left;
}

.seasons-heading h2 {
  margin: 0 0 8px;
  color: #ffcc00;
}

.seasons-heading p {
  color: #b8c0ce;
  font-size: 13px;
}

.seasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.season-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 13px;
  width: 100%;
  padding: 22px;
  color: #fff;
  background: linear-gradient(145deg, #20202a, #121219);
  border: 1px solid rgba(255, 204, 0, 0.35);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.season-card:hover {
  transform: translateY(-3px);
  border-color: #ffcc00;
}

.season-card-label {
  color: #ffcc00;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.season-card strong {
  font-size: 23px;
}

.season-card-status {
  color: #b8c0ce;
  font-size: 12px;
}

.season-card-action {
  margin-top: 8px;
  color: #ffcc00;
  font-size: 11px;
  font-weight: 800;
}

.season-standings {
  margin-top: 25px;
}

.season-standings h3 {
  color: #ffcc00;
  margin: 20px 0;
}

.season-close-btn {
  padding: 9px 13px;
  color: #ffcc00;
  background: #17171e;
  border: 1px solid #383844;
  border-radius: 8px;
  cursor: pointer;
}

.season-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.season-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.season-table th,
.season-table td {
  padding: 12px 10px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #383844;
  font-size: 12px;
}

.season-table th {
  color: #ffcc00;
  background: #17171e;
}

.season-table td {
  color: #e2e3e8;
}

@media (max-width: 600px) {
  .seasons-section {
    padding: 14px;
  }

  .seasons-grid {
    grid-template-columns: 1fr;
  }
}


/* Past Seasons dashboard button */
.past-seasons-entry {
  margin: 28px 0;
}

.past-seasons-button {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: none !important;
  padding: 22px;
  color: #fff !important;
  background: linear-gradient(135deg, #20202a, #101015) !important;
  border: 1px solid rgba(255, 176, 0, 0.45) !important;
  border-radius: 14px !important;
  text-align: left;
  cursor: pointer;
}

.past-seasons-button:hover {
  border-color: #ffb000 !important;
  transform: translateY(-2px);
}

.past-seasons-icon {
  font-size: 32px;
}

.past-seasons-button strong {
  display: block;
  color: #ffb000;
  font-size: 19px;
}

.past-seasons-button small {
  display: block;
  margin-top: 6px;
  color: #c5c5cf;
  font-size: 12px;
}

.past-seasons-arrow {
  margin-left: auto;
  color: #ffb000;
  font-size: 25px;
}

/* Page-like seasons views */
.season-page {
  margin: 28px 0;
  padding: 24px;
  background: #0e0e13;
  border: 1px solid #383844;
  border-radius: 14px;
  text-align: left;
}

.season-page h2 {
  margin-top: 22px;
  color: #ffb000;
}

.season-page-subtitle {
  margin-bottom: 22px;
  color: #c5c5cf;
  font-size: 14px;
}

.season-back-button {
  width: auto !important;
  max-width: none !important;
  padding: 10px 15px !important;
  color: #ffb000 !important;
  background: #20202a !important;
  border: 1px solid #383844 !important;
  border-radius: 8px !important;
  cursor: pointer;
}

.season-back-button:hover {
  border-color: #ffb000 !important;
}

.season-page .seasons-grid {
  margin-top: 24px;
}

.season-page .season-card {
  max-width: none;
}

@media (max-width: 600px) {
  .season-page {
    padding: 15px;
  }

  .past-seasons-button {
    padding: 16px;
  }

  .past-seasons-button strong {
    font-size: 16px;
  }
}


/* Season matches page */
.season-matches-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.season-match-card {
  padding: 18px;
  background: #17171e;
  border: 1px solid #383844;
  border-radius: 10px;
}

.season-match-card h3 {
  margin-top: 0;
  color: #ffcc00;
}

.season-match-card p {
  color: #e2e3e8;
  font-size: 13px;
}


.winner-text {
  color: #22c55e;
  font-weight: 700;
}

.loser-text {
  color: #ef4444;
  font-weight: 700;
}

</style>
