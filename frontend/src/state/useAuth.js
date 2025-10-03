import { create } from 'zustand'

const storageKey = 'certchain_token'

const useAuth = create((set,get)=>({
  token: localStorage.getItem(storageKey) || '',
  user: null,
  setAuth: ({token,user})=>{
    if(token){ localStorage.setItem(storageKey, token) }
    set({ token: token || get().token, user })
  },
  logout: ()=>{
    localStorage.removeItem(storageKey)
    set({ token: '', user: null })
  }
}))

export default useAuth

