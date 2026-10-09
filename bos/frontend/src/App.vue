
<template>
  <!-- Admin page -->
  <Admin
    v-if="showAdmin"
    @close="showAdmin = false"
  />

  <!-- Existing registration page -->
  <div v-else class="page">
    <div class="register-card">
      <div class="header">
        <h1>BATTLE OF SNIPERS</h1>
        <h2>SEASON 7</h2>
        <p>Official Tournament Registration</p>
      </div>

      <form @submit.prevent="register">
        <div class="form-group">
          <label>FF UID <span>*</span></label>
          <input
  v-model="form.ffUid"
  type="text"
  inputmode="numeric"
  pattern="[0-9]+"
  maxlength="20"
  placeholder="Enter Free Fire UID"
  required
  @input="form.ffUid = form.ffUid.replace(/[^0-9]/g, '')"
/>
        </div>

        <div class="form-group">
          <label>FF Name / IGN <span>*</span></label>
          <input
            v-model="form.ffName"
            type="text"
            placeholder="Enter your FF Name"
            required
          />
        </div>

        <div class="form-group">
          <label>Team Name <span>*</span></label>
          <input
  v-model="form.teamName"
  type="text"
  pattern="[A-Za-z0-9]+( [A-Za-z0-9]+)*"
  placeholder="Enter Team Name"
  required
  @input="form.teamName = form.teamName.replace(/[^A-Za-z0-9 ]/g, '').replace(/ +/g, ' ').replace(/^ /, '')"
/>
        </div>

        <div class="form-group">
          <label>Contact / WhatsApp Number <span>*</span></label>
          
<input
  v-model="form.contactNumber"
  type="tel"
  inputmode="numeric"
  pattern="[0-9]{10}"
  minlength="10"
  maxlength="10"
  placeholder="Enter 10-digit WhatsApp Number"
  required
  @input="form.contactNumber = form.contactNumber.replace(/[^0-9]/g, '').slice(0, 10)"
/>
        </div>

        <div class="form-group">
          <label>Team Logo <span>*</span></label>

          <div class="file-box">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="handleLogo"
              required
            />
          </div>

          <small>PNG, JPG or WEBP</small>
        </div>

        <button type="submit" class="register-btn">
          REGISTER NOW
        </button>
      </form>

      <div class="whatsapp-info">
        <p>After registration, join our official WhatsApp group.</p>
      </div>
    </div>

    <!-- Admin icon -->
    <button
      class="admin-btn"
      type="button"
      title="Admin Login"
      aria-label="Open admin login"
      @click="showAdmin = true"
    >
      ⚙
    </button>
  </div>
</template>

<script>
import Admin from "./Admin.vue";

export default {
  name: "App",

  components: {
    Admin
  },

  data() {
    return {
      showAdmin: false,

      form: {
        ffUid: "",
        ffName: "",
        teamName: "",
        contactNumber: "",
        teamLogo: null
      }
    };
  },

  methods: {
    handleLogo(event) {
      this.form.teamLogo = event.target.files[0] || null;
    },

    
async register() {
  try {
    if (!(this.form.teamLogo instanceof File)) {
      alert("Please select your team logo.");
      return;
    }

    const formData = new FormData();

    formData.append("ffUid", this.form.ffUid);
    formData.append("ffName", this.form.ffName);
    formData.append("teamName", this.form.teamName);
    formData.append("contactNumber", this.form.contactNumber);
    formData.append("teamLogo", this.form.teamLogo);

    const response = await fetch(
      "https://battle-of-snipers.onrender.com/api/register",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Registration failed."
      );
    }

    // Reset the form after successful registration.
    this.form = {
      ffUid: "",
      ffName: "",
      teamName: "",
      contactNumber: "",
      teamLogo: null
    };

    const fileInput = document.querySelector(
      '.register-card input[type="file"]'
    );

    if (fileInput) {
      fileInput.value = "";
    }

    // Show success message and open the WhatsApp group.
    const whatsappGroupLink =
      "https://chat.whatsapp.com/F3okjhQGtVzLxqJcr0EaWu";

    alert(
      "Registration successful!\n\n" +
      "Join our official WhatsApp group to get tournament updates."
    );

    window.open(
      whatsappGroupLink,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (error) {
    console.error("Registration error:", error);
    alert(error.message || "Unable to submit registration.");
  }
}
  }
};
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0b0b0f;
}

.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 15px;
  position: relative;
}

.register-card {
  width: 100%;
  max-width: 500px;
  padding: 35px;
  border-radius: 20px;
  background: #15151c;
  border: 1px solid #292933;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #ffb000;
  font-size: 28px;
  font-weight: 800;
}

.header h2 {
  margin: 5px 0;
  color: white;
  font-size: 22px;
}

.header p {
  color: #999;
  margin-top: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-group label span {
  color: #ff4444;
}

.form-group input {
  width: 100%;
  padding: 13px 14px;
  border-radius: 9px;
  border: 1px solid #33333d;
  background: #0e0e13;
  color: white;
  outline: none;
  font-size: 15px;
}

.form-group input:focus {
  border-color: #ffb000;
}

.file-box {
  background: #0e0e13;
  border: 1px dashed #444;
  border-radius: 9px;
  padding: 12px;
}

.file-box input {
  border: none;
  padding: 0;
}

small {
  display: block;
  margin-top: 6px;
  color: #777;
}

.register-btn {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  border: none;
  border-radius: 9px;
  background: #ffb000;
  color: #111;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.register-btn:hover {
  background: #ffc533;
}

.whatsapp-info {
  text-align: center;
  margin-top: 20px;
  color: #888;
  font-size: 13px;
}

.admin-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #333;
  background: #15151c;
  color: #888;
  cursor: pointer;
  font-size: 18px;
}

.admin-btn:hover {
  color: #ffb000;
  border-color: #ffb000;
}


/* Responsive layout improvements */
.page {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px 16px;
}

/* Keep the form within the screen */
.register-card {
  width: 100%;
  max-width: 500px;
  min-width: 0;
}

/* Prevent long headings from overflowing */
.header h1 {
  overflow-wrap: anywhere;
}

/* Tablet and mobile devices */
@media (max-width: 600px) {
  .page {
    align-items: flex-start;
    padding: 24px 12px 80px;
  }

  .register-card {
    max-width: 100%;
    padding: 24px 18px;
    border-radius: 15px;
  }

  .header {
    margin-bottom: 24px;
  }

  .header h1 {
    font-size: clamp(22px, 6vw, 28px);
    line-height: 1.25;
  }

  .header h2 {
    font-size: 20px;
  }

  .header p {
    font-size: 13px;
    line-height: 1.5;
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-group label {
    font-size: 14px;
    line-height: 1.4;
  }

  .form-group input {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    padding: 12px;
    font-size: 16px;
  }

  .file-box {
    padding: 10px;
    overflow: hidden;
  }

  .file-box input[type="file"] {
    max-width: 100%;
    font-size: 13px;
  }

  .register-btn {
    min-height: 48px;
    padding: 14px 10px;
    font-size: 15px;
  }

  .whatsapp-info {
    font-size: 12px;
    line-height: 1.6;
  }

  .admin-btn {
    right: 14px;
    bottom: 14px;
    width: 44px;
    height: 44px;
    z-index: 10;
  }
}

/* Very narrow phones */
@media (max-width: 360px) {
  .page {
    padding-right: 8px;
    padding-left: 8px;
  }

  .register-card {
    padding: 20px 13px;
  }

  .header h1 {
    font-size: 21px;
  }

  .form-group input {
    padding: 11px 9px;
  }
}

</style>
