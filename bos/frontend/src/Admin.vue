
<template>
  <div class="admin-page">
    <div class="admin-background"></div>

    <header class="topbar">
      <div class="brand">
        <span class="brand-icon">BOS</span>
        <div>
          <h2>BATTLE OF SNIPERS</h2>
          <p>SEASON 7 · ADMIN PANEL</p>
        </div>
      </div>

      <button class="back-btn" @click="$emit('close')"> ← Back to Registration </button>
    </header>

    <!-- ADMIN LOGIN -->
    <main v-if="!isLoggedIn" class="login-wrapper">
      <section class="login-card">
        <div class="shield">♜</div>
        <p class="eyebrow">RESTRICTED ACCESS</p>
        <h1>Admin Login</h1>
        <p class="subtitle"> Sign in to manage tournament registrations. </p>

        <form @submit.prevent="login">
          <label for="username">Admin Username</label>
          <input id="username" v-model.trim="username" type="text" placeholder="Enter username" autocomplete="username" required />

          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Enter password" autocomplete="current-password" required />

          <p v-if="errorMessage" class="error-message">  {{ errorMessage }} </p>

          <button class="primary-btn" type="submit" :disabled="loading"> {{ loading ? "VERIFYING..." : "LOGIN TO DASHBOARD →" }} </button>
        </form>

        <p class="secure-note">🔒 Authorized administrators only</p>
      </section>
    </main>

    <!-- ADMIN DASHBOARD -->
    <main v-else class="dashboard">
      <div class="dashboard-heading">
        <div>
          <p class="eyebrow">TOURNAMENT MANAGEMENT</p>
          <h1>Registration Dashboard</h1>
          <p class="subtitle"> View registered teams and their submitted details. </p>
        </div>

        <div class="header-actions">
          <button class="secondary-btn" @click="loadRegistrations"> ↻ Refresh </button>
          <button class="logout-btn" @click="logout"> Logout </button>
        </div>
      </div>

      <div class="stats-grid">
        <section class="stat-card">
          <span class="stat-label">TOTAL REGISTERED TEAMS</span>
          <strong> {{ registrations.length }} </strong>
          <span class="stat-caption">All saved registrations</span>
        </section>

        <section class="stat-card">
          <span class="stat-label">TEAM LOGOS</span>
          <strong> {{ logoCount }} </strong>
          <span class="stat-caption">Uploaded logo images</span>
        </section>
      </div>
      
      <section class="table-card tournament-settings">
        <div class="table-heading">
          <div>
            <h2>Tournament Mode</h2>
            <p>Control what players see on the public page.</p>
          </div>
          <button class="secondary-btn" type="button" @click="loadTournamentMode" :disabled="savingSettings"> Refresh Mode </button>
        </div>
        
        <p v-if="settingsError" class="error-message"> {{ settingsError }} </p>
        <p v-if="settingsMessage" class="settings-message"> {{ settingsMessage }} </p>
        
        <div class="mode-row">
          <div>
            <h3>Registration Open</h3>
      <p>Allow new players to register.</p>
    </div>
    <button
      type="button"
      class="mode-btn"
      :class="{ active: registrationOpen }"
      :disabled="savingSettings || settingsLoading"
      @click="setTournamentMode('registration')"
    >
      {{ registrationOpen ? "ON" : "OFF" }}
    </button>
  </div>

  <div class="mode-row">
    <div>
      <h3>Tournament Started</h3>
      <p>Show the live tournament page.</p>
    </div>
    <button
      type="button"
      class="mode-btn"
      :class="{ active: tournamentStarted }"
      :disabled="savingSettings || settingsLoading"
      @click="setTournamentMode('started')"
    >
      {{ tournamentStarted ? "ON" : "OFF" }}
    </button>
  </div>

  <p class="mode-status">
    Public page:
    <strong>{{ publicModeLabel }}</strong>
  </p>
  

<div
  v-if="!registrationOpen && !tournamentStarted"
  class="mode-row"
>
  <div>
    <h3>Matches Per Team</h3>
    <p>
      {{ groupATeamCount }} teams in Group A and
      {{ groupBTeamCount }} teams in Group B.
      Select one round or two rounds.
    </p>
  </div>

  <select
    v-model.number="matchesPerTeam"
    :disabled="
      savingSettings ||
      settingsLoading ||
      groupATeamCount < 2 ||
      groupATeamCount !== groupBTeamCount
    "
  >
    <option :value="null">Select matches</option>

    <option
      v-for="count in groupAMatchOptions"
      :key="count"
      :value="count"
    >
      {{ count }} matches per team
    </option>
  </select>
</div>


<div v-if="!registrationOpen && !tournamentStarted" class="mode-row">
  <div>
    <h3>Qualifiers Per Group</h3>
    <p>
      Select how many top teams from each group will qualify.
    </p>
  </div>

  <select
    v-model.number="qualifiersPerGroup"
    :disabled="
      savingSettings ||
      settingsLoading ||
      qualifierOptions.length === 0
    "
  >
    <option :value="null">Select qualifiers</option>

    <option
      v-for="count in qualifierOptions"
      :key="count"
      :value="count"
    >
      Top {{ count }} teams
    </option>
  </select>
</div>

<button v-if="!registrationOpen && !tournamentStarted"
  class="primary-btn"
  type="button"
  :disabled="savingSettings || settingsLoading"
  @click="saveMatchSettings"
>
  {{ savingSettings ? "SAVING..." : "SAVE MATCH SETTINGS" }}
</button>

</section>


<div class="match-panels">
<section
  v-if="!registrationOpen && tournamentStarted"
  class="table-card match-entry-card"
>
  <div class="table-heading">
    <div>
      <h2>Match Entry</h2>
      <p>Record a match result for Group A or Group B.</p>
    </div>
  </div>

  <p v-if="matchError" class="error-message">
    {{ matchError }}
  </p>

  <p v-if="matchMessage" class="settings-message">
    {{ matchMessage }}
  </p>

  <form class="match-form" @submit.prevent="saveMatch">
    <label for="matchGroup">Select Group</label>
    <select
      id="matchGroup"
      v-model="matchGroup"
      @change="resetMatchSelection"
      required
    >
      <option value="A">Group A</option>
      <option value="B">Group B</option>
    </select>

    <label for="winnerId">Winner Team</label>
    <select id="winnerId" v-model="winnerId" required>
      <option value="" disabled>Select winner</option>
      <option
        v-for="team in matchGroupTeams"
        :key="team._id"
        :value="team._id"
      >
        {{ team.teamName }}
      </option>
    </select>

    <label for="loserId">Loser Team</label>
    <select id="loserId" v-model="loserId" required>
      <option value="" disabled>Select loser</option>
      <option
        v-for="team in matchGroupTeams"
        :key="team._id"
        :value="team._id"
        :disabled="team._id === winnerId"
      >
        {{ team.teamName }}
      </option>
    </select>

    <label for="loserRounds">Loser's Rounds</label>
    <select id="loserRounds" v-model.number="loserRounds" required>
      <option :value="null" disabled>Select loser rounds</option>
      <option :value="0">0 rounds</option>
      <option :value="1">1 round</option>
      <option :value="2">2 rounds</option>
      <option :value="3">3 rounds</option>
      <option :value="4">4 rounds</option>
      <option :value="5">5 rounds</option>
      <option :value="6">6 rounds</option>
      <option :value="7">7 rounds</option>
    </select>

    <button
      class="primary-btn"
      type="submit"
      :disabled="matchSaving || matchGroupTeams.length < 2"
    >
      {{ matchSaving ? "SAVING MATCH..." : "SAVE MATCH RESULT" }}
    </button>

    <button
      class="undo-match-btn"
      type="button"
      :disabled="matchSaving || undoingMatch"
      @click="undoLastMatch"
    >
      {{ undoingMatch ? "UNDOING..." : "UNDO LAST MATCH" }}
    </button>
  </form>

  <p v-if="matchGroupTeams.length < 2" class="match-help">
    Assign at least two teams to this group before entering a match.
  </p>
</section>

<section v-if="!registrationOpen && tournamentStarted" class="table-card match-entry-card tie-breaker-card">
  <div class="table-heading">
    <div>
      <h2>Tie Breaker</h2>
      <p>Both teams lose 10 round points.</p>
    </div>
  </div>

  <p v-if="tieError" class="error-message">{{ tieError }}</p>
  <p v-if="tieMessage" class="settings-message">{{ tieMessage }}</p>

  <form class="match-form" @submit.prevent="saveTieBreaker">
    <label>Select Group</label>
    <select v-model="tieGroup" @change="resetTieSelection" required>
      <option value="A">Group A</option>
      <option value="B">Group B</option>
    </select>

    <label>First Team</label>
    <select v-model="tieTeam1" required>
      <option value="" disabled>Select team</option>
      <option v-for="team in tieGroupTeams" :key="team._id" :value="team._id">
        {{ team.teamName }}
      </option>
    </select>

    <label>Second Team</label>
    <select v-model="tieTeam2" required>
      <option value="" disabled>Select team</option>
      <option
        v-for="team in tieGroupTeams"
        :key="team._id"
        :value="team._id"
        :disabled="team._id === tieTeam1"
      >
        {{ team.teamName }}
      </option>
    </select>

    <button class="primary-btn" type="submit" :disabled="tieSaving">
      {{ tieSaving ? "SAVING..." : "SAVE TIE BREAKER" }}
    </button>
  </form>
</section>
</div>
      <section class="table-card">
        <div class="table-heading">
          <div>
            <h2>Registered Teams</h2>
            <p>Latest registrations appear first.</p>
          </div>

          <input
            v-model="searchQuery"
            class="search-input"
            type="search"
            placeholder="Search teams, UID, or contact..."
            aria-label="Search registrations"
          />
        </div>
<p v-if="groupError" class="error-message dashboard-error">
  {{ groupError }}
</p>
        <p v-if="dashboardError" class="error-message dashboard-error">
          {{ dashboardError }}
        </p>

        <div v-if="loadingRegistrations" class="empty-state">
          Loading registrations...
        </div>

        <div
          v-else-if="filteredRegistrations.length === 0"
          class="empty-state"
        >
          {{ searchQuery ? "No matching registrations found." : "No registrations found yet." }}
        </div>

        <div v-else class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TEAM LOGO</th>
                <th>FREE FIRE UID</th>
                <th>FREE FIRE NAME</th>
                <th>TEAM NAME</th>
                <th>GROUP ASSIGNMENT</th>
                <th>CONTACT NUMBER</th>
                <th>REGISTERED AT</th>
                <th>LOGO FILE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(registration, index) in filteredRegistrations"
                :key="registration._id || index"
              >
                <td>
                  <a
                    v-if="registration.teamLogo"
                    :href="registration.teamLogo"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open team logo"
                  >
                    <img
                      class="team-logo"
                      :src="registration.teamLogo"
                      :alt="registration.teamName + ' logo'"
                      loading="lazy"
                    />
                  </a>
                  <span v-else class="no-logo">No logo</span>
                </td>

                <td class="uid">{{ registration.ffUid }}</td>
                <td>{{ registration.ffName }}</td>
                <td class="team-name">{{ registration.teamName }}</td>
                <td>
  <select
    class="group-select"
    :value="registration.group || ''"
    :disabled="savingGroupId === registration._id || registrationOpen || tournamentStarted"
    :aria-label="'Assign group for ' + registration.teamName"
    @change="saveTeamGroup(registration, $event.target.value)"
  >
    <option value="">Unassigned</option>
    <option value="A">Group A</option>
    <option value="B">Group B</option>
  </select>

  <small
    v-if="savingGroupId === registration._id"
    class="group-saving"
  >
    Saving...
  </small>
</td>
                <td>{{ registration.contactNumber }}</td>
                <td>{{ formatDate(registration.registeredAt) }}</td>

                <td>
                  <a
                    v-if="registration.teamLogo"
                    class="download-link"
                    :href="registration.teamLogo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View / Download ↗
                  </a>
                  <span v-else>—</span>
                </td>
                <td>
                    <button class="delete-btn" type="button" :disabled="deletingId === registration._id" @click="deleteRegistration(registration)" >
                        {{ deletingId === registration._id ? "Deleting..." : "Delete" }} 
                    </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          Showing {{ filteredRegistrations.length }} of
          {{ registrations.length }} registrations
        </div>
      </section>

      <p class="footer-note">
        BATTLE OF SNIPERS · SEASON 7 · ADMIN CONTROL CENTER
      </p>
    </main>
  </div>
</template>

<script>
export default {
  name: "TournamentAdmin",

  emits: ["close"],

  data() {
    return {
      username: "",
      password: "",
      token: "",
      isLoggedIn: false,
      loading: false,
      loadingRegistrations: false,
      errorMessage: "",
      dashboardError: "",
      registrations: [],
      searchQuery: "",
      deletingId: null,
      savingGroupId: null,
      groupError: "",
      registrationOpen: false,
      tournamentStarted: false,
      groupAMatches: null,
      groupBMatches: null,
      matchesPerTeam: null,
      qualifiersPerGroup: null,
      settingsLoading: false,
      savingSettings: false,
      settingsError: "",
      settingsMessage: "",
      matchGroup: "A",
      winnerId: "",
      loserId: "",
      loserRounds: null,
      matchSaving: false,
      undoingMatch: false,
      matchError: "",
      matchMessage: "",
      tieGroup: "A",
      tieTeam1: "",
      tieTeam2: "",
      tieSaving: false,
      tieError: "",
      tieMessage: ""
    };
  },

  computed: {
    logoCount() {
      return this.registrations.filter((item) => item.teamLogo).length;
    },

    filteredRegistrations() {
      const query = this.searchQuery.trim().toLowerCase();

      if (!query) {
        return this.registrations;
      }

      return this.registrations.filter((item) => {
        return [
          item.ffUid,
          item.ffName,
          item.teamName,
          item.contactNumber
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      });
    },

    publicModeLabel() {
      if (this.tournamentStarted) {
        return "Live Standings";
      }
      
      if (this.registrationOpen) {
        return "Registration Page";
      }
      return "Tournament Not Yet Started";
    },

    matchGroupTeams() {
      return this.registrations.filter(
        registration => registration.group === this.matchGroup
      );
    },

    tieGroupTeams() {
  return this.registrations.filter(
    registration => registration.group === this.tieGroup
  );
},

    groupATeamCount() {
  return this.registrations.filter(
    registration => registration.group === "A"
  ).length;
},

groupBTeamCount() {
  return this.registrations.filter(
    registration => registration.group === "B"
  ).length;
},

groupAMatchOptions() {
  const teams = this.groupATeamCount;
  if (teams < 2) return [];

  return [teams - 1, 2 * (teams - 1)];
},

groupBMatchOptions() {
  const teams = this.groupBTeamCount;
  if (teams < 2) return [];

  return [teams - 1, 2 * (teams - 1)];
},
qualifierOptions() {
  if (
    this.groupATeamCount < 1 ||
    this.groupATeamCount !== this.groupBTeamCount
  ) {
    return [];
  }

  return Array.from(
    { length: this.groupATeamCount },
    (_, index) => index + 1
  );
}
  },

  methods: {
    async login() {
      this.errorMessage = "";
      this.loading = true;

      try {
        const response = await fetch(
          "https://battle-of-snipers.onrender.com/api/admin/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: this.username,
              password: this.password
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed.");
        }

        this.token = data.token;
        this.password = "";
        this.isLoggedIn = true;

        await this.loadRegistrations();
        await this.loadTournamentMode();
      } catch (error) {
        this.errorMessage =
          error.message || "Unable to connect to the server.";
      } finally {
        this.loading = false;
      }
    },

    async loadRegistrations() {
      this.loadingRegistrations = true;
      this.dashboardError = "";

      try {
        const response = await fetch(
          "https://battle-of-snipers.onrender.com/api/admin/registrations",
          {
            headers: {
              Authorization: "Bearer " + this.token
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            this.logout();
            this.errorMessage =
              data.message || "Please log in again.";
            return;
          }

          throw new Error(
            data.message || "Could not load registrations."
          );
        }

        this.registrations = data.registrations || [];
      } catch (error) {
        this.dashboardError =
          error.message || "Unable to load registrations.";
      } finally {
        this.loadingRegistrations = false;
      }
    },

async loadTournamentMode() {
  this.settingsLoading = true;
  this.settingsError = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/tournament-mode"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load tournament mode.");
    }

this.registrationOpen = data.registrationOpen;
this.tournamentStarted = data.tournamentStarted;

this.groupAMatches = data.groupAMatches ?? null;
this.groupBMatches = data.groupBMatches ?? null;

this.matchesPerTeam =
  data.groupAMatches === data.groupBMatches
    ? data.groupAMatches
    : null;

this.qualifiersPerGroup = data.qualifiersPerGroup ?? null;

  } catch (error) {
    this.settingsError =
      error.message || "Could not load tournament settings.";
  } finally {
    this.settingsLoading = false;
  }
},

async setTournamentMode(mode) {
  if (this.savingSettings || this.settingsLoading) return;

  let registrationOpen = this.registrationOpen;
  let tournamentStarted = this.tournamentStarted;

  if (mode === "registration") {
    registrationOpen = !this.registrationOpen;
    tournamentStarted = false;
  } else if (mode === "started") {
    tournamentStarted = !this.tournamentStarted;
    registrationOpen = false;
  }

  this.savingSettings = true;
  this.settingsError = "";
  this.settingsMessage = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/admin/tournament-mode",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          registrationOpen,
          tournamentStarted
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(data.message || "Could not update tournament mode.");
    }

    this.registrationOpen = data.registrationOpen;
    this.tournamentStarted = data.tournamentStarted;
    this.settingsMessage = "Tournament mode updated successfully.";
  } catch (error) {
    this.settingsError =
      error.message || "Could not save tournament settings.";
  } finally {
    this.savingSettings = false;
  }
},

async saveMatchSettings() {
  if (this.savingSettings || this.settingsLoading) return;
  
const teamCount = this.groupATeamCount;

if (
  teamCount < 2 ||
  teamCount !== this.groupBTeamCount
) {
  this.settingsError =
    "Both groups must have an equal number of at least 2 teams.";
  return;
}

if (
  this.matchesPerTeam !== null &&
  this.matchesPerTeam !== teamCount - 1 &&
  this.matchesPerTeam !== 2 * (teamCount - 1)
) {
  this.settingsError =
    `Select ${teamCount - 1} or ${2 * (teamCount - 1)} matches per team.`;
  return;
}

  this.savingSettings = true;
  this.settingsError = "";
  this.settingsMessage = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/admin/tournament-mode",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          registrationOpen: this.registrationOpen,
          tournamentStarted: this.tournamentStarted,
          groupAMatches: this.matchesPerTeam,
          groupBMatches: this.matchesPerTeam,
          qualifiersPerGroup: this.qualifiersPerGroup
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(
        data.message || "Could not save match settings."
      );
    }

    
this.groupAMatches = data.groupAMatches ?? null;
this.groupBMatches = data.groupBMatches ?? null;

this.matchesPerTeam =
  data.groupAMatches === data.groupBMatches
    ? data.groupAMatches
    : null;

this.qualifiersPerGroup = data.qualifiersPerGroup ?? null;

    this.settingsMessage = "Match settings saved successfully.";
  } catch (error) {
    this.settingsError =
      error.message || "Could not save match settings.";
  } finally {
    this.savingSettings = false;
  }
},

async saveTeamGroup(registration, selectedGroup) {
  if (this.savingGroupId) return;

  this.savingGroupId = registration._id;
  this.groupError = "";
  this.dashboardError = "";

  const previousGroup = registration.group || null;
  const group = selectedGroup === "" ? null : selectedGroup;

  try {
    const response = await fetch(
      `https://battle-of-snipers.onrender.com/api/admin/registrations/${encodeURIComponent(registration._id)}/group`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({ group })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(data.message || "Could not save team group.");
    }

    registration.group = data.registration.group;
    this.settingsMessage =
      `${registration.teamName} assigned to ${
        registration.group ? "Group " + registration.group : "Unassigned"
      }.`;
  } catch (error) {
    registration.group = previousGroup;
    this.groupError = error.message || "Could not save team group.";
  } finally {
    this.savingGroupId = null;
  }
},


resetMatchSelection() {
  this.winnerId = "";
  this.loserId = "";
  this.loserRounds = null;
  this.matchError = "";
  this.matchMessage = "";
},

async saveMatch() {
  if (this.matchSaving) return;

  if (!this.winnerId || !this.loserId ||
      this.winnerId === this.loserId) {
    this.matchError = "Select two different teams.";
    return;
  }

  if (
  this.loserRounds === null ||
  this.loserRounds === undefined ||
  !Number.isInteger(this.loserRounds) ||
  this.loserRounds < 0 ||
  this.loserRounds > 7
) {
  this.matchError = "Please select the loser's rounds.";
  return;
}

  this.matchSaving = true;
  this.matchError = "";
  this.matchMessage = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/admin/standings/match",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          group: this.matchGroup,
          winnerId: this.winnerId,
          loserId: this.loserId,
          loserRounds: this.loserRounds
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(data.message || "Could not save match.");
    }

    this.matchMessage = data.message || "Match saved successfully.";
    this.winnerId = "";
    this.loserId = "";
    this.loserRounds = null;
  } catch (error) {
    this.matchError = error.message || "Could not save match.";
  } finally {
    this.matchSaving = false;
  }
},


resetTieSelection() {
  this.tieTeam1 = "";
  this.tieTeam2 = "";
  this.tieError = "";
  this.tieMessage = "";
},

async saveTieBreaker() {
  if (this.tieSaving) return;

  if (
    !this.tieTeam1 ||
    !this.tieTeam2 ||
    this.tieTeam1 === this.tieTeam2
  ) {
    this.tieError = "Select two different teams.";
    return;
  }

  this.tieSaving = true;
  this.tieError = "";
  this.tieMessage = "";

  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/admin/standings/tie-breaker",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          group: this.tieGroup,
          team1Id: this.tieTeam1,
          team2Id: this.tieTeam2
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not save tie breaker."
      );
    }

    this.tieMessage =
      data.message || "Tie breaker saved successfully.";

    this.tieTeam1 = "";
    this.tieTeam2 = "";
  } catch (error) {
    this.tieError = error.message;
  } finally {
    this.tieSaving = false;
  }
},

async undoLastMatch() {
  if (this.matchSaving || this.undoingMatch) return;

  if (!window.confirm(
    `Undo the last match recorded for Group ${this.matchGroup}?`
  )) {
    return;
  }

  this.undoingMatch = true;
  this.matchError = "";
  this.matchMessage = "";

  try {
    const response = await fetch(
      `https://battle-of-snipers.onrender.com/api/admin/standings/${this.matchGroup}/undo`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.token
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(data.message || "Could not undo match.");
    }

    this.matchMessage = data.message || "Last match undone.";
  } catch (error) {
    this.matchError = error.message || "Could not undo match.";
  } finally {
    this.undoingMatch = false;
  }
},

async deleteRegistration(registration) {
  const confirmed = window.confirm(
    `Permanently delete "${registration.teamName}"?\n\nThis will delete the registration from MongoDB and its team logo from Cloudinary.`
  );

  if (!confirmed) return;

  this.deletingId = registration._id;
  this.dashboardError = "";

  try {
    const response = await fetch(
      `https://battle-of-snipers.onrender.com/api/admin/registrations/${encodeURIComponent(registration._id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + this.token
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        this.errorMessage = data.message || "Please log in again.";
        return;
      }

      throw new Error(data.message || "Deletion failed.");
    }

    this.registrations = this.registrations.filter(
      item => item._id !== registration._id
    );

    alert(data.message || "Registration and logo deleted successfully.");
  } catch (error) {
    this.dashboardError =
      error.message || "Unable to delete registration.";
  } finally {
    this.deletingId = null;
  }
},

    logout() {
      this.token = "";
      this.password = "";
      this.username = "";
      this.isLoggedIn = false;
      this.registrations = [];
      this.searchQuery = "";
      this.dashboardError = "";
    },

    formatDate(date) {
      if (!date) return "—";

      const parsed = new Date(date);

      if (Number.isNaN(parsed.getTime())) return "—";

      return parsed.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    }
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-page {
  position: relative;
  min-height: 100vh;
  padding: 0 5%;
  overflow: hidden;
  color: #f5f5f5;
  background: #080a0e;
  font-family: Arial, Helvetica, sans-serif;
}

.admin-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 15% 0%, rgba(210, 160, 50, 0.12), transparent 42%),
    radial-gradient(ellipse at 90% 80%, rgba(155, 105, 20, 0.09), transparent 38%);
}

.topbar,
.login-wrapper,
.dashboard {
  position: relative;
  z-index: 1;
}

.topbar {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid rgba(226, 181, 78, 0.2);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid #cda64d;
  border-radius: 12px;
  color: #f0c96a;
  font-weight: 900;
  letter-spacing: 1px;
}

.brand h2 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 1.4px;
}

.brand p,
.eyebrow {
  margin: 6px 0 0;
  color: #d5ac50;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

.back-btn,
.secondary-btn,
.logout-btn {
  padding: 11px 15px;
  border: 1px solid #41434a;
  border-radius: 8px;
  background: #11141a;
  color: #eee;
  cursor: pointer;
}

.back-btn:hover,
.secondary-btn:hover {
  border-color: #d4ad54;
}

.login-wrapper {
  display: grid;
  min-height: calc(100vh - 89px);
  place-items: center;
  padding: 45px 0;
}

.login-card {
  width: 100%;
  max-width: 430px;
  padding: 36px;
  border: 1px solid rgba(217, 177, 83, 0.28);
  border-radius: 18px;
  background: rgba(17, 19, 25, 0.95);
  box-shadow: 0 25px 90px rgba(0, 0, 0, 0.35);
}

.shield {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 22px;
  border: 1px solid #d4ad54;
  border-radius: 14px;
  color: #eac363;
  font-size: 26px;
}

.login-card h1,
.dashboard-heading h1 {
  margin: 10px 0;
  font-size: clamp(26px, 4vw, 34px);
}

.subtitle {
  color: #9da1ac;
  line-height: 1.6;
  font-size: 13px;
}

.login-card form {
  display: flex;
  flex-direction: column;
  margin-top: 28px;
}

.login-card label {
  margin: 0 0 8px;
  color: #ddd;
  font-size: 12px;
}

.login-card input,
.search-input {
  width: 100%;
  min-width: 0;
  margin-bottom: 20px;
  padding: 13px 14px;
  border: 1px solid #363a44;
  border-radius: 8px;
  outline: none;
  background: #090b10;
  color: #fff;
}

.login-card input:focus,
.search-input:focus {
  border-color: #d4ad54;
}

.primary-btn {
  padding: 15px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(110deg, #d3a642, #f0d17b);
  color: #15120a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.secure-note {
  margin: 24px 0 0;
  color: #8e929b;
  text-align: center;
  font-size: 11px;
}

.error-message {
  margin: 0 0 16px;
  color: #ff8d8d;
  font-size: 12px;
  line-height: 1.5;
}

.dashboard {
  padding: 38px 0 28px;
}

.dashboard-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.dashboard-heading h1 {
  margin-bottom: 5px;
}

.dashboard-heading .subtitle {
  margin-top: 6px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.logout-btn {
  border-color: rgba(235, 106, 106, 0.5);
  color: #ffaaaa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 23px;
  border: 1px solid #292c34;
  border-radius: 13px;
  background: rgba(18, 21, 28, 0.92);
}

.stat-label {
  color: #b4b7c0;
  font-size: 10px;
  letter-spacing: 1.4px;
}

.stat-card strong {
  color: #f0ca6a;
  font-size: 36px;
}

.stat-caption {
  color: #858a95;
  font-size: 12px;
}

.table-card {
  overflow: hidden;
  border: 1px solid #292c34;
  border-radius: 13px;
  background: rgba(15, 17, 23, 0.96);
}

.table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border-bottom: 1px solid #292c34;
}

.table-heading h2 {
  margin: 0 0 7px;
  font-size: 17px;
}

.table-heading p {
  margin: 0;
  color: #9296a0;
  font-size: 12px;
}

.search-input {
  max-width: 320px;
  margin: 0;
}

.table-scroll {
  overflow-x: auto;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  text-align: left;
}

th,
td {
  padding: 15px 17px;
  border-bottom: 1px solid #252831;
  font-size: 12px;
}

th {
  background: #11141b;
  color: #d5b35d;
  font-size: 10px;
  letter-spacing: 0.8px;
}

td {
  color: #d5d7dd;
}

tbody tr:hover {
  background: rgba(210, 169, 74, 0.045);
}

.team-logo {
  display: block;
  width: 54px;
  height: 54px;
  object-fit: contain;
  border: 1px solid #363943;
  border-radius: 9px;
  background: #080a0e;
}

.uid {
  color: #eac363;
  font-weight: 700;
}

.team-name {
  color: #fff;
  font-weight: 700;
}

.download-link {
  color: #eac363;
  text-decoration: none;
}

.download-link:hover {
  text-decoration: underline;
}

.no-logo {
  color: #888;
}

.empty-state {
  padding: 45px 20px;
  color: #a3a6ae;
  text-align: center;
  font-size: 13px;
}

.dashboard-error {
  padding: 16px 22px 0;
}

.table-footer {
  padding: 15px 20px;
  color: #9296a0;
  font-size: 11px;
}

.footer-note {
  margin: 28px 0 0;
  color: #777c87;
  text-align: center;
  font-size: 10px;
  letter-spacing: 1.5px;
}

@media (max-width: 760px) {
  .admin-page {
    padding: 0 4%;
  }

  .topbar {
    align-items: flex-start;
    padding: 17px 0;
  }

  .brand h2 {
    font-size: 11px;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
  }

  .back-btn {
    max-width: 140px;
    font-size: 11px;
  }

  .login-card {
    padding: 25px;
  }

  .dashboard-heading,
  .table-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    max-width: none;
  }
}
.delete-btn {
  padding: 9px 13px;
  border: 1px solid #a83d45;
  border-radius: 7px;
  background: #35161b;
  color: #ff9ca3;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.delete-btn:hover:not(:disabled) {
  background: #68232b;
  color: #fff;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}


/* ===== Enhanced mobile responsiveness ===== */

.admin-page {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-wrap: anywhere;
}

.topbar,
.dashboard-heading,
.table-heading,
.header-actions {
  min-width: 0;
}

.brand {
  min-width: 0;
}

.brand h2 {
  overflow-wrap: anywhere;
  line-height: 1.4;
}

.back-btn,
.secondary-btn,
.logout-btn,
.delete-btn {
  min-height: 42px;
  touch-action: manipulation;
}

.login-card {
  min-width: 0;
}

.login-card input {
  min-height: 46px;
  font-size: 16px;
}

.table-scroll {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Phones and smaller tablets */
@media (max-width: 760px) {
  .admin-page {
    padding-right: 12px;
    padding-left: 12px;
  }

  .topbar {
    min-height: auto;
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    padding: 16px 0;
  }

  .brand {
    gap: 10px;
  }

  .brand-icon {
    flex: 0 0 40px;
  }

  .brand h2 {
    font-size: 13px;
    letter-spacing: 1px;
  }

  .brand p,
  .eyebrow {
    font-size: 9px;
    letter-spacing: 1.3px;
    line-height: 1.5;
  }

  .back-btn {
    width: 100%;
    max-width: none;
    text-align: center;
  }

  .login-wrapper {
    min-height: auto;
    padding: 28px 0;
  }

  .login-card {
    max-width: 100%;
    padding: 24px 18px;
    border-radius: 14px;
  }

  .login-card h1,
  .dashboard-heading h1 {
    font-size: 26px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .dashboard {
    padding: 24px 0;
  }

  .dashboard-heading {
    align-items: stretch;
    gap: 16px;
    margin-bottom: 20px;
  }

  .dashboard-heading .subtitle {
    line-height: 1.6;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .secondary-btn,
  .logout-btn {
    width: 100%;
    padding: 11px 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }

  .stat-card {
    min-width: 0;
    padding: 15px 12px;
    gap: 8px;
  }

  .stat-label {
    font-size: 9px;
    letter-spacing: 0.6px;
    line-height: 1.5;
  }

  .stat-card strong {
    font-size: 30px;
  }

  .stat-caption {
    font-size: 11px;
    line-height: 1.5;
  }

  .table-card {
    border-radius: 10px;
  }

  .table-heading {
    align-items: stretch;
    gap: 15px;
    padding: 16px 14px;
  }

  .table-heading h2 {
    font-size: 17px;
  }

  .search-input {
    width: 100%;
    max-width: none;
    min-height: 46px;
    margin: 0;
    font-size: 16px;
  }

  /* Keep all columns accessible with horizontal swiping */
  .table-scroll {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  th,
  td {
    padding: 12px 13px;
    font-size: 12px;
  }

  .team-logo {
    width: 46px;
    height: 46px;
  }

  .delete-btn {
    min-width: 72px;
    padding: 10px;
  }

  .dashboard-error {
    padding: 14px;
    overflow-wrap: anywhere;
  }

  .table-footer {
    padding: 13px;
    line-height: 1.5;
  }

  .footer-note {
    font-size: 9px;
    line-height: 1.7;
    letter-spacing: 1px;
  }
}

/* Very narrow phones */
@media (max-width: 380px) {
  .admin-page {
    padding-right: 9px;
    padding-left: 9px;
  }

  .login-card {
    padding: 21px 14px;
  }

  .login-card h1,
  .dashboard-heading h1 {
    font-size: 23px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }

  .header-actions {
    grid-template-columns: 1fr;
  }
}


.mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(226, 181, 78, 0.15);
}

.mode-row h3 {
  margin: 0;
  font-size: 15px;
}

.mode-row p {
  margin: 6px 0 0;
  color: #a9abb4;
  font-size: 13px;
}

.mode-btn {
  min-width: 76px;
  padding: 10px 18px;
  border: 1px solid #555;
  border-radius: 8px;
  background: #22252c;
  color: #eee;
  font-weight: 700;
  cursor: pointer;
}

.mode-btn.active {
  border-color: #d5ac50;
  background: #d5ac50;
  color: #111;
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-status {
  margin: 18px 0 0;
  color: #ddd;
}

.settings-message {
  color: #75df9b;
  font-size: 13px;
}


.match-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  max-width: 520px;
}

.match-form label {
  margin-top: 8px;
  color: #ddd;
  font-size: 12px;
}

.match-form select {
  width: 100%;
  padding: 12px;
  border: 1px solid #363a44;
  border-radius: 8px;
  background: #090b10;
  color: #fff;
}

.match-form select:focus {
  outline: 1px solid #d4ad54;
}

.undo-match-btn {
  padding: 13px;
  border: 1px solid #a64c4c;
  border-radius: 8px;
  background: #291517;
  color: #ffbaba;
  font-weight: 700;
  cursor: pointer;
}

.undo-match-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.match-help {
  color: #d5ac50;
  font-size: 12px;
  margin-top: 14px;
}

/* ===== Professional Tournament Dropdowns ===== */

.mode-row select,
.match-form select,
select {
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 42px 10px 14px;

  border: 1px solid #41434a;
  border-radius: 9px;

  background-color: #11141a;
  color: #f5f5f5;

  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
  outline: none;

  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.mode-row select {
  width: 220px;
  max-width: 100%;
}

.mode-row select:hover,
.match-form select:hover,
select:hover {
  border-color: #cda64d;
  background-color: #171a21;
}

.mode-row select:focus,
.match-form select:focus,
select:focus {
  border-color: #e2b54e;
  box-shadow: 0 0 0 3px rgba(226, 181, 78, 0.14);
}

.mode-row select:disabled,
.match-form select:disabled,
select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Dropdown option colors where supported */
.mode-row select option,
.match-form select option,
select option {
  background-color: #11141a;
  color: #f5f5f5;
}

/* Keep settings rows responsive */
@media (max-width: 760px) {
  .mode-row {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .mode-row select {
    width: 100%;
  }
}

/* ===== Registered Teams: Fit Within Page ===== */

.table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

.table-scroll table {
  width: 100%;
  min-width: 0 !important;
  table-layout: fixed;
  border-collapse: collapse;
}

.table-scroll th,
.table-scroll td {
  padding: 12px 6px;
  font-size: 10px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}

/* Logo */
.table-scroll th:nth-child(1),
.table-scroll td:nth-child(1) {
  width: 7%;
}

/* Free Fire UID */
.table-scroll th:nth-child(2),
.table-scroll td:nth-child(2) {
  width: 11%;
}

/* Free Fire Name */
.table-scroll th:nth-child(3),
.table-scroll td:nth-child(3) {
  width: 12%;
}

/* Team Name */
.table-scroll th:nth-child(4),
.table-scroll td:nth-child(4) {
  width: 11%;
}

/* Group Assignment */
.table-scroll th:nth-child(5),
.table-scroll td:nth-child(5) {
  width: 14%;
}

/* Contact Number */
.table-scroll th:nth-child(6),
.table-scroll td:nth-child(6) {
  width: 12%;
}

/* Registered At */
.table-scroll th:nth-child(7),
.table-scroll td:nth-child(7) {
  width: 14%;
}

/* Logo File */
.table-scroll th:nth-child(8),
.table-scroll td:nth-child(8) {
  width: 11%;
}

/* Actions */
.table-scroll th:nth-child(9),
.table-scroll td:nth-child(9) {
  width: 8%;
}

/* Group dropdown */
.table-scroll .group-select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 8px 4px;
  font-size: 10px;
}

/* Compact logo and action button */
.table-scroll .team-logo {
  width: 38px;
  height: 38px;
}

.table-scroll .delete-btn {
  padding: 7px 5px;
  min-width: 0;
  font-size: 10px;
}

.table-scroll .download-link {
  white-space: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .table-scroll th,
  .table-scroll td {
    padding: 8px 3px;
    font-size: 8px;
  }

  .table-scroll .team-logo {
    width: 28px;
    height: 28px;
  }

  .table-scroll .group-select {
    font-size: 8px;
    padding: 6px 2px;
  }

  .table-scroll .delete-btn {
    padding: 6px 3px;
    font-size: 8px;
  }
}


.match-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.match-panels > .table-card {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .match-panels {
    grid-template-columns: 1fr;
  }
}

</style>
