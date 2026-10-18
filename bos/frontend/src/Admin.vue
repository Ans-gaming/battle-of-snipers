
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
      
      <button class="back-btn" @click="$emit('close')"> ← {{ backButtonLabel }} </button>
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
          <h1>Admin Dashboard</h1>
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
        </section>

        <section class="stat-card">
          <span class="stat-label">TEAM LOGOS</span>
          <strong> {{ logoCount }} </strong>
        </section>
      </div>
      
      <section class="table-card tournament-settings">
        <div class="table-heading">
          <div>
            <h2>Tournament Mode</h2>
          </div>
          <button class="secondary-btn" type="button" @click="loadTournamentMode" :disabled="savingSettings"> Refresh Mode </button>
        </div>
        
        <p v-if="settingsError" class="error-message"> {{ settingsError }} </p>
        <p v-if="settingsMessage" class="settings-message"> {{ settingsMessage }} </p>
        
        <div class="mode-options">
          <div class="mode-row">
            <div>
              <h3>Registration Open</h3>
              <p>Allow new players to register.</p>
            </div>
            <button type="button" class="mode-btn" :class="{ active: registrationOpen }" :disabled="savingSettings || settingsLoading" @click="setTournamentMode('registration')"> {{ registrationOpen ? "ON" : "OFF" }} </button>
          </div>
          
          <div class="mode-row">
            <div>
              <h3>Tournament Started</h3>
              <p>Show the live tournament page.</p>
            </div>
            <button type="button" class="mode-btn" :class="{ active: tournamentStarted }" :disabled="savingSettings || settingsLoading" @click="setTournamentMode('started')"> {{ tournamentStarted ? "ON" : "OFF" }} </button>
          </div>
        </div>
      </section>
      
      <section v-if="!registrationOpen && !tournamentStarted" class="table-card match-settings-card">
        <div class="table-heading match-settings-heading">
          <h2>Match Settings</h2>
          <button class="primary-btn" type="button" :disabled="savingSettings || settingsLoading" @click="saveMatchSettings"> {{ savingSettings ? "SAVING..." : "SAVE MATCH SETTINGS" }} </button>
        </div>
        
        <div class="match-settings-grid">
          <div class="match-setting-item">
            <h3>Matches Per Team</h3>
            <select v-model.number="matchesPerTeam" :disabled="savingSettings || settingsLoading || groupATeamCount < 2 || groupATeamCount !== groupBTeamCount">
              <option :value="null">Select matches</option>
              <option v-for="count in groupAMatchOptions" :key="count" :value="count"> {{ count }} matches per team </option>
            </select>
          </div>
          
          <div class="match-setting-item">
            <h3>Qualifiers Per Group</h3>
            <select v-model.number="qualifiersPerGroup" :disabled="savingSettings || settingsLoading || qualifierOptions.length === 0">
              <option :value="null">Select qualifiers</option>
              <option v-for="count in qualifierOptions" :key="count" :value="count"> Top {{ count }} teams </option>
            </select>
          </div>
        </div>
      </section>

      <!-- SCHEDULE MATCHES CARD -->
      <section v-if="!registrationOpen && !tournamentStarted" class="table-card schedule-matches-card">
        <div class="table-heading">
          <div>
            <h2>Schedule Matches</h2>
            <p>Assign teams, match date, time and match coordinator.</p>
          </div>
        </div>

        <form class="schedule-match-form" @submit.prevent="scheduleMatch">
          <div class="schedule-group-assigned-row">
            <div>
              <label for="scheduleGroup">Select Group</label>
              <select id="scheduleGroup" v-model="scheduleGroup" @change="resetScheduleTeams" required>
                <option value="A">Group A</option>
                <option value="B">Group B</option>
              </select>
            </div>
            
            <div>
              <label for="scheduleAssignedTo">Assigned To</label>
              <input id="scheduleAssignedTo" v-model.trim="scheduleAssignedTo" type="text" placeholder="Enter admin/person name" required/>
            </div>
          </div>
          <div class="schedule-team-row">
            <div>
              <label for="scheduleTeam1">Team 1</label>
              <select id="scheduleTeam1" v-model="scheduleTeam1" required>
                <option value="" disabled>Select team</option>
                <option v-for="team in scheduleGroupTeams" :key="team._id" :value="team._id"> {{ team.teamName }} </option>
              </select>
            </div>
            <span class="schedule-vs">VS</span>
            <div>
              <label for="scheduleTeam2">Team 2</label>
              <select id="scheduleTeam2" v-model="scheduleTeam2" required>
                <option value="" disabled>Select team</option>
                <option v-for="team in scheduleGroupTeams" :key="team._id" :value="team._id" :disabled="team._id === scheduleTeam1"> {{ team.teamName }} </option>
              </select>
            </div>
          </div>

          
<div class="schedule-date-time-row">
  <div class="schedule-date-field">
    <label for="scheduleDate">Match Date</label>
    <input id="scheduleDate" v-model="scheduleDate" type="date" required />
  </div>

  <div class="schedule-time-field">
    <label for="scheduleTime">Match Time</label>
    <input id="scheduleTime" v-model="scheduleTime" type="time" required />
  </div>

  <button
    type="button"
    class="edit-scheduled-matches-btn"
    @click="showScheduledMatches = true; loadScheduledMatches()"
  >
    EDIT SCHEDULED MATCHES
  </button>
</div>

          
          <div v-if="showScheduledMatches" class="scheduled-matches-overlay" @click.self="showScheduledMatches = false">
            <section class="scheduled-matches-panel" role="dialog" aria-modal="true" aria-labelledby="scheduledMatchesTitle">
              <div class="scheduled-matches-panel-header">
                <div class="scheduled-matches-title">
                  <span class="scheduled-matches-eyebrow">TOURNAMENT CONTROL</span>
                  <h3 id="scheduledMatchesTitle">Manage Scheduled Matches</h3>
                  <p>View, filter and update your scheduled fixtures.</p>
                </div>
                <button type="button" class="close-scheduled-matches-btn" @click="showScheduledMatches = false"> CLOSE </button>
              </div>
            
              <div class="scheduled-match-filters">
                <button type="button" :class="{ active: scheduledMatchFilter === 'all' }" @click="scheduledMatchFilter = 'all'"> ALL MATCHES </button>
                <button type="button" :class="{ active: scheduledMatchFilter === 'upcoming' }" @click="scheduledMatchFilter = 'upcoming'"> UPCOMING </button>
                <button type="button" :class="{ active: scheduledMatchFilter === 'completed' }" @click="scheduledMatchFilter = 'completed'"> COMPLETED </button>
              </div>
              
              <div v-if="filteredScheduledMatches.length === 0" class="scheduled-match-empty">
                No scheduled matches found.
              </div>
              
              <div v-else class="scheduled-match-list">
                <div v-for="match in filteredScheduledMatches" :key="match._id" class="scheduled-match-item">
                  <h4>{{ match.team1Name }} vs {{ match.team2Name }}</h4>
                  <p>Group: {{ match.group }}</p>
                  <p>Assigned To: {{ match.assignedTo }}</p>
                  <p>Match Date: {{ new Date(match.matchDate).toLocaleString() }}</p>
                  <div class="scheduled-match-actions">
                    <button v-if="new Date(match.matchDate).getTime() > Date.now()" type="button" class="edit-match-btn" @click="editScheduledMatch(match)"> EDIT </button>
                    <button type="button" class="delete-match-btn" @click="deleteScheduledMatch(match)"> DELETE </button>
                  </div>
                </div>
              </div>

              <div v-if="editingScheduledMatchId" class="edit-scheduled-match-form">
                <h3>Edit Scheduled Match</h3>
                <label for="editScheduleGroup">Group</label>
                <select id="editScheduleGroup" v-model="editScheduleGroup" @change="editScheduleTeam1 = ''; editScheduleTeam2 = ''" required>
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                </select>
            
                <label for="editScheduleTeam1">Team 1</label>
                <select id="editScheduleTeam1" v-model="editScheduleTeam1" required>
                  <option v-for="team in editScheduleGroupTeams" :key="team._id" :value="team._id"> {{ team.teamName }} </option>
                </select>
                
                <label for="editScheduleTeam2">Team 2</label>
                <select id="editScheduleTeam2" v-model="editScheduleTeam2" required>
                  <option v-for="team in editScheduleGroupTeams" :key="team._id" :value="team._id"> {{ team.teamName }} </option>
                </select>
                
                <label for="editScheduleAssignedTo">Assigned To</label>
                <input id="editScheduleAssignedTo" v-model.trim="editScheduleAssignedTo" type="text" placeholder="Enter admin/person name" required/>
                <label for="editScheduleDate">Match Date</label>
                <input id="editScheduleDate" v-model="editScheduleDate" type="date" required/>
                <label for="editScheduleTime">Match Time</label>
                <input id="editScheduleTime" v-model="editScheduleTime" type="time" required/>
                <button type="button" class="cancel-edit-match-btn" @click="editingScheduledMatchId = ''"> CANCEL EDIT </button>
                <button type="button" class="primary-btn" @click="saveScheduledMatchEdits"> SAVE CHANGES </button>
              </div>
            </section>
          </div>
       
          <p v-if="scheduleError" class="error-message"> {{ scheduleError }} </p>
          <p v-if="scheduleMessage" class="settings-message"> {{ scheduleMessage }} </p>
          <button class="primary-btn" type="submit"> SCHEDULE MATCH </button>
        </form>
      </section>
      
      <div class="match-panels">
        <section v-if="!registrationOpen && tournamentStarted" class="table-card match-entry-card">
          <div class="table-heading">
            <div>
              <h2>Match Entry</h2>
              <p>Record a match result for Group A or Group B.</p>
            </div>
          </div>
          
          <p v-if="matchError" class="error-message"> {{ matchError }} </p>
          <p v-if="matchMessage" class="settings-message"> {{ matchMessage }} </p>
          
          <form class="match-form" @submit.prevent="saveMatch">
            <label for="matchGroup">Select Group</label>
            <select id="matchGroup" v-model="matchGroup" @change="resetMatchSelection" required>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
            </select>
            
            <label for="winnerId">Winner Team</label>
            <select id="winnerId" v-model="winnerId" required>
              <option value="" disabled>Select winner</option>
              <option v-for="team in matchGroupTeams" :key="team._id" :value="team._id"> {{ team.teamName }} </option>
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

      <button
      class="undo-match-btn"
      type="button"
      :disabled="matchSaving || undoingMatch"
      @click="undoLastMatch"
    >
      {{ undoingMatch ? "UNDOING..." : "UNDO LAST MATCH" }}
    </button>
  </form>
</section>
</div>
      <section class="table-card">
        <div class="table-heading">
          <div>
            <h2>Registered Teams</h2>
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
      tieMessage: "",
      scheduleGroup: "A",
      scheduleTeam1: "",
      scheduleTeam2: "",
      scheduleDate: "",
      scheduleTime: "",
      scheduleAssignedTo: "",
      scheduleError: "",
      scheduleMessage: "",
      scheduleSaving: false,
      showScheduledMatches: false,
      scheduledMatchFilter: "all",
      scheduledMatches: [],
      currentTime: Date.now(),
      scheduledMatchesTimer: null,
      editingScheduledMatchId: "",
      editScheduleDate: "",
      editScheduleTime: "",
      editScheduleGroup: "A",
      editScheduleTeam1: "",
      editScheduleTeam2: "",
      editScheduleAssignedTo: ""
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
    
    backButtonLabel() {
      if (this.registrationOpen) {
        return "Back to Registration";
      }
      
      if (this.tournamentStarted) {
        return "Back to Tournament";
      }
      
      return "Back";
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

scheduleGroupTeams() {
  return this.registrations.filter(
    registration => registration.group === this.scheduleGroup
  );
},

editScheduleGroupTeams() {
  return this.registrations.filter(
    registration => registration.group === this.editScheduleGroup
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
}, 
    filteredScheduledMatches() {
      const now = this.currentTime;

      if (this.scheduledMatchFilter === "upcoming") {
        return this.scheduledMatches.filter(
          match => new Date(match.matchDate).getTime() > now
        );
      }

      if (this.scheduledMatchFilter === "completed") {
        return this.scheduledMatches.filter(
          match => new Date(match.matchDate).getTime() <= now
        );
      }

      return this.scheduledMatches;
    }
  },

  mounted() {
  this.scheduledMatchesTimer = setInterval(() => {
    this.currentTime = Date.now();
  }, 1000);
},

beforeUnmount() {
  clearInterval(this.scheduledMatchesTimer);
},

  methods: {
    resetScheduleTeams() {
      this.scheduleTeam1 = "";
      this.scheduleTeam2 = "";
    },
    
    editScheduledMatch(match) {
  if (new Date(match.matchDate).getTime() <= this.currentTime) {
    alert("Completed matches cannot be edited.");
    return;
  }

  const matchDate = new Date(match.matchDate);

  this.editingScheduledMatchId = match._id;
  this.editScheduleGroup = match.group;
  this.editScheduleTeam1 = match.team1Id;
  this.editScheduleTeam2 = match.team2Id;
  this.editScheduleAssignedTo = match.assignedTo || "";
  this.editScheduleDate = [
    matchDate.getFullYear(),
    String(matchDate.getMonth() + 1).padStart(2, "0"),
    String(matchDate.getDate()).padStart(2, "0")
  ].join("-");

  this.editScheduleTime = [
    String(matchDate.getHours()).padStart(2, "0"),
    String(matchDate.getMinutes()).padStart(2, "0")
  ].join(":");
},

async saveScheduledMatchEdits() {
  if (!this.editingScheduledMatchId) {
    alert("Please select a match to edit.");
    return;
  }

  if (
    !this.editScheduleTeam1 ||
    !this.editScheduleTeam2 ||
    this.editScheduleTeam1 === this.editScheduleTeam2
  ) {
    alert("Please select two different teams.");
    return;
  }

  if (!this.editScheduleDate || !this.editScheduleTime) {
    alert("Please select the match date and time.");
    return;
  }

  if (!this.editScheduleAssignedTo.trim()) {
    alert("Please enter the assigned person's name.");
    return;
  }

  const matchDateTime = new Date(
    `${this.editScheduleDate}T${this.editScheduleTime}`
  );

  if (
    Number.isNaN(matchDateTime.getTime()) ||
    matchDateTime.getTime() <= Date.now()
  ) {
    alert("Please select a future date and time.");
    return;
  }

  try {
    const response = await fetch(
      `https://battle-of-snipers.onrender.com/api/admin/scheduled-matches/${this.editingScheduledMatchId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          group: this.editScheduleGroup,
          team1Id: this.editScheduleTeam1,
          team2Id: this.editScheduleTeam2,
          matchDate: matchDateTime.toISOString(),
          assignedTo: this.editScheduleAssignedTo.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not update the scheduled match.");
      return;
    }

    alert("Scheduled match updated successfully.");

    this.editingScheduledMatchId = "";
    this.editScheduleDate = "";
    this.editScheduleTime = "";
    this.editScheduleGroup = "A";
    this.editScheduleTeam1 = "";
    this.editScheduleTeam2 = "";
    this.editScheduleAssignedTo = "";

    await this.loadScheduledMatches();
  } catch (error) {
    console.error("Updating scheduled match failed:", error);
    alert("Could not update the scheduled match. Please try again.");
  }
},

async deleteScheduledMatch(match) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${match.team1Name} vs ${match.team2Name}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `https://battle-of-snipers.onrender.com/api/admin/scheduled-matches/${match._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + this.token
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not delete the match.");
      return;
    }

    // Close edit form if the deleted match was being edited
    if (this.editingScheduledMatchId === match._id) {
      this.editingScheduledMatchId = "";
    }

    alert("Match deleted successfully.");

    // Reload matches from the database
    await this.loadScheduledMatches();
  } catch (error) {
    console.error("Deleting scheduled match failed:", error);
    alert("Could not delete the match. Please try again.");
  }
},

    async loadScheduledMatches() {
  try {
    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/admin/scheduled-matches",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + this.token
        },
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load scheduled matches.");
      return;
    }

    this.scheduledMatches = data.scheduledMatches || [];
  } catch (error) {
    console.error("Loading scheduled matches failed:", error);
    alert("Could not load scheduled matches. Please try again.");
  }
},

    async scheduleMatch() {
      this.scheduleError = "";
      this.scheduleMessage = "";
      
      if (this.scheduleSaving) return;
      if (!this.scheduleTeam1 || !this.scheduleTeam2) {
        this.scheduleError = "Please select both teams.";
        return;
      }
      
      if (this.scheduleTeam1 === this.scheduleTeam2) {
        this.scheduleError = "Team 1 and Team 2 must be different.";
        return;
      }
      
      const team1 = this.scheduleGroupTeams.find(
        team => team._id === this.scheduleTeam1
      );
      
      const team2 = this.scheduleGroupTeams.find(
        team => team._id === this.scheduleTeam2
      );
      
      if (!team1 || !team2) {
        this.scheduleError =  "Selected teams are invalid. Please select them again.";
        return;
      }

  if (!this.scheduleDate || !this.scheduleTime) {
    this.scheduleError = "Please select the match date and time.";
    return;
  }

  const matchDateTime = new Date(
    `${this.scheduleDate}T${this.scheduleTime}`
  );

  if (
    Number.isNaN(matchDateTime.getTime()) ||
    matchDateTime <= new Date()
  ) {
    this.scheduleError = "Please select a future date and time.";
    return;
  }

  if (!this.scheduleAssignedTo.trim()) {
    this.scheduleError = "Please enter the assigned person's name.";
    return;
  }

  
this.scheduleSaving = true;

try {
  const response = await fetch(
    "https://battle-of-snipers.onrender.com/api/admin/scheduled-matches",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.token
      },
      body: JSON.stringify({
        group: this.scheduleGroup,
        team1Id: team1._id,
        team2Id: team2._id,
        matchDate: matchDateTime.toISOString(),
        assignedTo: this.scheduleAssignedTo.trim()
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Could not schedule the match."
    );
  }

  this.scheduleMessage =
    data.message || "Match scheduled successfully.";

  // Reset the form after a successful save.
  this.scheduleTeam1 = "";
  this.scheduleTeam2 = "";
  this.scheduleDate = "";
  this.scheduleTime = "";
  this.scheduleAssignedTo = "";

} catch (error) {
  this.scheduleError =
    error.message || "Unable to schedule the match.";
} finally {
  this.scheduleSaving = false;
}

},

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
      if (this.scheduledMatchesTimer) {
        clearInterval(this.scheduledMatchesTimer);
        this.scheduledMatchesTimer = null;
      }

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
  padding: 30px 22px 22px;
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

/* Schedule Matches Form */
.schedule-matches-card {
  margin-top: 24px;
}

.schedule-match-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.schedule-match-form label {
  display: block;
  margin-top: 4px;
  color: #d6d8df;
  font-size: 12px;
  font-weight: 600;
}

.schedule-match-form input,
.schedule-match-form select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #363a44;
  border-radius: 8px;
  outline: none;
  background: #090b10;
  color: #fff;
  font-size: 13px;
}

.schedule-match-form input:focus,
.schedule-match-form select:focus {
  border-color: #d4ad54;
}

.schedule-team-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 14px;
}


.schedule-date-time-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 1fr) auto;
  align-items: end;
  gap: 24px;
  width: 100%;
}

.schedule-date-time-row > div {
  min-width: 0;
}

.schedule-date-time-row .edit-scheduled-matches-btn {
  justify-self: end;
  grid-column: 3;
  margin: 0;
  white-space: nowrap;
  width: fit-content;
  align-self: end;
}


.schedule-date-time-row .schedule-date-field input {
  width: 220px;
  max-width: 100%;
  grid-column: 1;
}

.schedule-date-time-row .schedule-time-field {
  grid-column: 2;
  justify-self: center;
  width: 206px;
  max-width: 100%;
}

.schedule-date-time-row .schedule-time-field input {
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 700px) {
  .schedule-date-time-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .schedule-date-time-row .schedule-date-field,
  .schedule-date-time-row .schedule-time-field,
  .schedule-date-time-row .edit-scheduled-matches-btn {
    grid-column: 1;
    justify-self: stretch;
    width: 100%;
  }
}

.schedule-team-row > div {
  min-width: 0;
}

.schedule-vs {
  padding-bottom: 12px;
  color: #f0ca6a;
  font-size: 12px;
  font-weight: 900;
}

.schedule-match-form .primary-btn {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .schedule-match-form {
    padding: 16px;
  }

  .schedule-team-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .schedule-vs {
    padding: 0;
    text-align: center;
  }
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


.mode-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 16px;
}

.mode-options .mode-row {
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(226, 181, 78, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
}

@media (max-width: 640px) {
  .mode-options {
    grid-template-columns: 1fr;
  }
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
  width: calc(100% - 40px);
  max-width: 520px;
  margin: 20px auto;
  box-sizing: border-box;
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
  margin-bottom: 20px;
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

.tournament-mode-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .tournament-mode-options {
    grid-template-columns: 1fr;
  }
}


.tournament-settings {
  margin-bottom: 18px;
}

.match-settings-card {
  margin-top: 24px;
}


.match-settings-card {
  margin-top: 24px;
}

.match-settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.match-settings-heading h2 {
  margin: 0;
}

.match-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  padding: 24px 20px;
}

.match-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 1px solid #302d26;
  border-radius: 16px;
  background: #12141a;
}

.match-setting-item h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.match-setting-item select {
  width: 190px;
  max-width: 55%;
  flex-shrink: 0;
}

@media (max-width: 700px) {
  .match-settings-grid {
    grid-template-columns: 1fr;
  }

  .match-setting-item {
    flex-wrap: wrap;
  }

  .match-setting-item select {
    width: 100%;
    max-width: 100%;
  }
}

.tie-breaker-card {
  min-height: 0;
  height: fit-content;
  align-self: start;
}

.tie-breaker-card form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tie-breaker-card .undo-match-btn {
  margin-top: 0;
}

@media (max-width: 768px) {
  .tie-breaker-card {
    min-height: auto;
  }
}


.schedule-match-form input[type="date"],
.schedule-match-form input[type="time"] {
  color-scheme: dark !important;
  accent-color: #f0ca6a;
  -webkit-appearance: auto;
  appearance: auto;
}

.schedule-match-form input[type="date"]::-webkit-calendar-picker-indicator,
.schedule-match-form input[type="time"]::-webkit-calendar-picker-indicator {
  opacity: 1 !important;
  filter: brightness(0) invert(1) !important;
  cursor: pointer;
}

.schedule-group-assigned-row {
  display: grid;
  grid-template-columns: minmax(180px, 0.50fr) minmax(0, 0.50fr);
  gap: 18px;
  align-items: end;
}

.schedule-group-assigned-row > div {
  min-width: 0;
}

@media (max-width: 600px) {
  .schedule-group-assigned-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.edit-scheduled-matches-btn {
  align-self: end;
  min-height: 56px;
  padding: 14px 24px;
  border: 1px solid #e7bd55;
  border-radius: 9px;
  background: #17171e;
  color: #f0ca6a;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.edit-scheduled-matches-btn:hover {
  background: #f0ca6a;
  color: #111;
}


/* Scheduled matches: full-screen modal backdrop */
.scheduled-matches-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(3, 5, 10, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Main modal card */
.scheduled-matches-overlay .scheduled-matches-panel {
  width: min(900px, 100%);
  max-height: min(82vh, 760px);
  overflow-y: auto;
  padding: 28px;
  background: #101116;
  color: #f5f5f7;
  border: 1px solid rgba(232, 187, 75, 0.35);
  border-radius: 20px;
  box-shadow: 0 24px 90px rgba(0, 0, 0, 0.55);
}

/* Header */
.scheduled-matches-overlay .scheduled-matches-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid #292b34;
}

.scheduled-matches-title h3 {
  margin: 8px 0;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.scheduled-matches-title p {
  margin: 0;
  color: #9699a6;
  font-size: 14px;
}

.scheduled-matches-eyebrow {
  color: #e9bd58;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

/* Close button */
.scheduled-matches-overlay .close-scheduled-matches-btn {
  flex-shrink: 0;
  padding: 10px 15px;
  border: 1px solid #41434d;
  border-radius: 9px;
  background: #191a21;
  color: #f5f5f7;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.scheduled-matches-overlay .close-scheduled-matches-btn:hover {
  border-color: #e9bd58;
  color: #e9bd58;
}

/* Filters */
.scheduled-matches-overlay .scheduled-match-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 22px 0;
}

.scheduled-matches-overlay .scheduled-match-filters button {
  padding: 10px 16px;
  border: 1px solid #30323b;
  border-radius: 9px;
  background: #17181f;
  color: #b8bac4;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: 0.2s ease;
}

.scheduled-matches-overlay .scheduled-match-filters button.active {
  background: #e9bd58;
  border-color: #e9bd58;
  color: #15120a;
}

.scheduled-matches-overlay .scheduled-match-filters button:hover {
  border-color: #e9bd58;
}

/* Match list */
.scheduled-matches-overlay .scheduled-match-list {
  display: grid;
  gap: 14px;
}

.scheduled-matches-overlay .scheduled-match-item {
  padding: 20px;
  border: 1px solid #2b2d37;
  border-radius: 13px;
  background: linear-gradient(135deg, #191a22, #121319);
  transition: border-color 0.2s ease,
              transform 0.2s ease;
}

.scheduled-matches-overlay .scheduled-match-item:hover {
  border-color: rgba(233, 189, 88, 0.65);
  transform: translateY(-2px);
}

.scheduled-matches-overlay .scheduled-match-item h4 {
  margin: 0 0 15px;
  font-size: 17px;
  line-height: 1.5;
  color: #ffffff;
}

.scheduled-matches-overlay .scheduled-match-item p {
  margin: 8px 0;
  color: #a9abb7;
  font-size: 13px;
  line-height: 1.6;
}

.scheduled-matches-overlay .scheduled-match-item p:last-of-type {
  color: #e9bd58;
}

.scheduled-matches-overlay .edit-match-btn {
  margin-top: 12px;
  padding: 9px 20px;
  border: 1px solid #e9bd58;
  border-radius: 8px;
  background: rgba(233, 189, 88, 0.08);
  color: #e9bd58;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.scheduled-matches-overlay .edit-match-btn:hover {
  background: #e9bd58;
  color: #15120a;
}

/* Match action buttons */
.scheduled-match-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.scheduled-matches-overlay .scheduled-match-actions .edit-match-btn,
.scheduled-matches-overlay .scheduled-match-actions .delete-match-btn {
  margin-top: 0;
  min-width: 110px;
  padding: 11px 20px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scheduled-matches-overlay .scheduled-match-actions .delete-match-btn {
  border: 1px solid #ef5350;
  background: rgba(239, 83, 80, 0.09);
  color: #ff6b68;
}

.scheduled-matches-overlay .scheduled-match-actions .delete-match-btn:hover {
  background: #ef5350;
  border-color: #ef5350;
  color: #ffffff;
  box-shadow: 0 0 16px rgba(239, 83, 80, 0.22);
  transform: translateY(-2px);
}

.scheduled-matches-overlay .scheduled-match-actions .delete-match-btn:active {
  transform: scale(0.97);
}

/* Empty state */
.scheduled-matches-overlay .scheduled-match-empty {
  padding: 40px 20px;
  border: 1px dashed #363844;
  border-radius: 12px;
  color: #a9abb7;
  text-align: center;
}

/* Small screens */
@media (max-width: 600px) {
  .scheduled-matches-overlay {
    padding: 12px;
  }

  .scheduled-matches-overlay .scheduled-matches-panel {
    padding: 18px;
    max-height: 88vh;
    border-radius: 15px;
  }

  .scheduled-matches-title h3 {
    font-size: 20px;
  }

  .scheduled-matches-overlay .scheduled-match-item {
    padding: 15px;
  }
}

/* Cancel Edit Button */
.cancel-edit-match-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  margin-top: 12px;
  margin-bottom: 10px;

  background: linear-gradient(135deg, #252525, #111111);
  color: #f0c75e;

  border: 1px solid #c99b32;
  border-radius: 8px;

  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1.2px;

  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.cancel-edit-match-btn:hover {
  background: linear-gradient(135deg, #d8ad43, #f3d77c);
  color: #111111;
  border-color: #f3d77c;
  box-shadow: 0 0 18px rgba(240, 199, 94, 0.3);
  transform: translateY(-2px);
}

.cancel-edit-match-btn:active {
  transform: scale(0.97);
  box-shadow: none;
}

.cancel-edit-match-btn:focus-visible {
  outline: 2px solid #f0c75e;
  outline-offset: 3px;
}

</style>
