<style scoped>
.home{
    margin-left: auto;
    margin-right: auto;
    width: 1500px;
  }
.addmargin {
  margin-top: 10px;
  margin-bottom: 10px;
}

.vue-logo-back {
  background-color: black;
}

.logo {
  width: 144px;
}

.fullbody {
  width: 100%;
}
.floatLeft{
  float: left;
}

.floatRight{
  float: right;
}

.noBullet{
  list-style-type:none;
}

.title {
  color: grey;
  font-size: 18px;
}

</style>
<template>
   <div class="home marginRight marginLeft">
     <h3 class="leftAlign">Welcome, {{user.name}} !</h3>
     <div class="row">
      <div class="col-md-6">
        <Profile/>
      </div>
      <div class="col-md-6">
        <Dashboard/>
      </div>
     </div>    
   </div>
</template>


<script>
import Dashboard from '@/components/Dashboard.vue'
import Profile from '@/components/Profile.vue'
export default {
  name: "PanelPage",
  components: { 
    Dashboard,
    Profile
  },
  data() {
    return {
      appList: [],
      user: {},
      appName: "",
      authToken: localStorage.getItem('authToken')
    };
  },
  created() {
    const usrStr = localStorage.getItem('user')
    this.user = JSON.parse(usrStr);
  },
  methods: {
    gotosubpage: id => {
      this.$router.push(`${id}`);
    },
    logout(){
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem("credentials")
      localStorage.removeItem("userData")
      
      if(this.$route.params.nextUrl != null){
                    this.$router.push(this.$route.params.nextUrl)
                }else{
        this.$router.push('/login')
                }
    },
  },
};
</script>
