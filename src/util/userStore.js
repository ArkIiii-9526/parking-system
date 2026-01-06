import { ref } from 'vue'

export function useUserStore() {
  const userInfo = ref(null)

  const loadUserInfo = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
    }
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const clearUserInfo = () => {
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  return {
    userInfo,
    loadUserInfo,
    setUserInfo,
    clearUserInfo
  }
}