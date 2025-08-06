import jwt from 'jsonwebtoken'

const decodeToken = (token: string | undefined) => {
    try {
        if(!token) return false

        const decoded = jwt.decode(token)
        console.log(decoded)

    } catch (error) {
        return false
    }
}

export default decodeToken