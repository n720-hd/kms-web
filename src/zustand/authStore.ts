import {create} from 'zustand';

interface IAuth {
    userId?: number,
    firstName: string,
    lastName: string,
    profilePictureUrl: string,
    role: string,
    username: string,
    email: string,
   
    
 }

 interface IAuthStore extends IAuth{
    setKeepAuth: (user: IAuth) => void,
    setClearAuth: () => void,
    setAuth: (user: IAuth) => void
 }

const authStore = create<IAuthStore>(((set) => ({
    userId: undefined,
    firstName: '',
    lastName: '',
    profilePictureUrl: '',
    role: '',
    username: '',
    email: '',

    setAuth: ({userId, firstName, lastName, profilePictureUrl, role, username, email}: IAuth) => set({userId, firstName, lastName, profilePictureUrl, role, username, email}),
    setKeepAuth: ({userId, firstName, lastName, profilePictureUrl, role, username, email}: IAuth) => set({userId, firstName, lastName, profilePictureUrl, role, username, email}),
    setClearAuth: () => set({userId: undefined, firstName: '', lastName: '', profilePictureUrl: '', role: '', username: '', email: ''})

})
))

export default authStore;