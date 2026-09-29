import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IUser } from '@/models/user.model';

type UserData = Pick<
  IUser,
  | 'name'
  | 'email'
  | 'role'
  | 'partnerOnboardingSteps'
  | 'partnerStatus'
  | 'videoKycStatus'
  | 'rejectionReason'
  | 'videoKycRejectionReason'
  | 'videoKycRoomId'
> & {
  _id: string
}

interface IUserState {
  userData: UserData | null
}

const initialState: IUserState = {
  userData: null
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<UserData | null>) => {
      state.userData = action.payload
    },
    clearUserData: (state) => {
      state.userData = null
    },
  },
})

export const { setUserData, clearUserData } = userSlice.actions

export default userSlice.reducer