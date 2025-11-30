import { createSlice } from '@reduxjs/toolkit';

const initialState = { token: null, username: null, externalId: null, id: null };

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession(state, action) {
            const {token, username, externalId, id} = action.payload;
            state.token = token;
            state.username = username;
            state.externalId = externalId;
            state.id = id;
        },
        clearSession(state) {
            state.token = null; state.username = null; state.externalId = null; state.id = null;
        }
    }
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
