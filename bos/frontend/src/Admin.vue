
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

      <button class="back-btn" @click="$emit('close')">
        ← Back to Registration
      </button>
    </header>

    <!-- ADMIN LOGIN -->
    <main v-if="!isLoggedIn" class="login-wrapper">
      <section class="login-card">
        <div class="shield">♜</div>
        <p class="eyebrow">RESTRICTED ACCESS</p>
        <h1>Admin Login</h1>
        <p class="subtitle">
          Sign in to manage tournament registrations.
        </p>

        <form @submit.prevent="login">
          <label for="username">Admin Username</label>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            placeholder="Enter username"
            autocomplete="username"
            required
          />

          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            required
          />

          <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </p>

          <button class="primary-btn" type="submit" :disabled="loading">
            {{ loading ? "VERIFYING..." : "LOGIN TO DASHBOARD →" }}
          </button>
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
          <p class="subtitle">
            View registered teams and their submitted details.
          </p>
        </div>

        <div class="header-actions">
          <button class="secondary-btn" @click="loadRegistrations">
            ↻ Refresh
          </button>
          <button class="logout-btn" @click="logout">
            Logout
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <section class="stat-card">
          <span class="stat-label">TOTAL REGISTERED TEAMS</span>
          <strong>{{ registrations.length }}</strong>
          <span class="stat-caption">All saved registrations</span>
        </section>

        <section class="stat-card">
          <span class="stat-label">TEAM LOGOS</span>
          <strong>{{ logoCount }}</strong>
          <span class="stat-caption">Uploaded logo images</span>
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
      deletingId: null
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
    }
  },

  methods: {
    async login() {
      this.errorMessage = "";
      this.loading = true;

      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/login",
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
          "http://localhost:5000/api/admin/registrations",
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

    
async deleteRegistration(registration) {
  const confirmed = window.confirm(
    `Permanently delete "${registration.teamName}"?\n\nThis will delete the registration from MongoDB and its team logo from Cloudinary.`
  );

  if (!confirmed) return;

  this.deletingId = registration._id;
  this.dashboardError = "";

  try {
    const response = await fetch(
      `http://localhost:5000/api/admin/registrations/${encodeURIComponent(registration._id)}`,
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

table {
  min-width: 1000px;
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

  table {
    min-width: 1000px;
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

</style>
