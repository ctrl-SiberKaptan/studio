import  Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        schemaList:[],
        vcList: [],
        templateList: []
    },
    getters: {
        totalSchemas(state){
            return state.schemaList.length;
        },
        totalCredentials(state){
            return state.vcList.length;
        },
        findSchemaBySchemaID: (state) => (schemaId)=> {
            return state.schemaList.find(x => x.schemaId === schemaId);
        },
        listOfAllSchemaOptions(state){
            let schemaIdnames = state.schemaList.map(x => {
                if(x.schemaId && x.schemaId !== undefined && x.status === 'Registered'){
                    return {
                        text: x.schemaDetails.name,
                        value: x.schemaId
                    }
                } else {
                    return null
                }
            })
            // filtering empty object
            schemaIdnames = schemaIdnames.filter(x => x)
            schemaIdnames.unshift({ value: null, text: "Please select a schema" })
            return schemaIdnames;
        }
    },
    mutations: {
        insertAschema(state, payload){
            if(!state.schemaList.find(x => x._id === payload._id)){
                state.schemaList.push(payload);
            }else{
                console.log('already exists scheme id =' + payload._id);
                this.updateAschema(state,payload)
            }
        },
        insertApresentationTemplate(state, payload){
            if(!state.templateList.find(x => x._id === payload._id)){
                state.templateList.push(payload);
            }
        },
        // updateAschema(state, payload){
        //     if(state.schemaList.find(x => x._id === payload._id)){
        //         const index = state.schemaList.findIndex(x => x._id === payload._id);
        //         state.schemaList[index] = payload;
        //     }
        // },
        insertAcredential(state, payload){
            if(!state.vcList.find(x => x._id === payload._id)){
                state.vcList.push(payload);
            }else{
                console.log('already exists credential id =' + payload._id);
            }
        },
        // updateAcredential(state, payload){
        //     if(state.vcList.find(x => x.id === payload.id)){
        //         const index = state.vcList.findIndex(x => x._id === payload._id);
        //         state.vcList[index] = payload;
        //     }
        // }
    },
    actions: {
        insertAschema({commit}, payload){
            const { schemaId } = payload;
            if(schemaId){
                const url  = `https://jagrat.hypersign.id/node1/rest/hypersign-protocol/hidnode/ssi/schema/${schemaId}:`
                fetch(url).then(response => response.json()).then(json => {
                    const shcemaDetial = json.schema[0];
                    if(shcemaDetial.schema.properties){
                        let propertiesStr = shcemaDetial.schema.properties;
                        const props = JSON.parse(propertiesStr)
                        shcemaDetial.schema.properties = props;
                    }
                    payload['schemaDetails'] =shcemaDetial;
                    commit('insertAschema', payload);    
                }).catch(e => console.log)
            } else {
                commit('insertAschema', payload);    
            }
        },
        insertAcredential({commit}, payload) {
            const { vc_id } = payload;
            if(vc_id){
                fetch(vc_id+':').then(response => response.json()).then(json => {
                    Object.assign(payload, { ...json});
                    commit('insertAcredential', payload);
                }).catch(e => console.log)
            } else {
                commit('insertAcredential', payload);
            } 
        }
    }
})