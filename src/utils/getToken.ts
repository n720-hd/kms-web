import Cookies from "js-cookie"

export const getToken = async() => {
    const token = Cookies.get('token')
    return token
}