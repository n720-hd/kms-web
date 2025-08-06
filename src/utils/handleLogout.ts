import { useMutation } from "@tanstack/react-query"
import instance from "./axiosInstance"
import { toast } from "react-toastify"

export const mutateLogout = () => {
    return useMutation({
        mutationFn: async() => {
            return await instance.get('/auth/logout')
        },
        onSuccess: () => {
            toast.success('Successfully logged out')
        },
        onError: () => {
            toast.error('Something went wrong')
        }
    })
}