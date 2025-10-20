import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
    state: () => ({
        wsCount: 0
    }),
    getters: {
        getWsCount: (state) => state.wsCount
    },
    actions: {
        connection() {
            this.wsCount++;
        },
        close() {
            this.wsCount--;
        }
    },
})