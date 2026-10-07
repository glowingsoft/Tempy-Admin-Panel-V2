import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { user: null },

  reducers: {
    setUser: (state, action) => {
      const user = { ...action.payload };
      const name =
        user?.basicInfo?.name || user?.name || user?.displayName || '';
      const photo =
        user?.basicInfo?.profileIcon ||
        user?.profileIcon ||
        user?.photoURL ||
        '';

      user.displayName = name;
      user.photoURL = photo;
      user.profileIcon = photo;
      if (user.basicInfo) {
        user.basicInfo = {
          ...user.basicInfo,
          name: user.basicInfo.name || name,
          profileIcon: user.basicInfo.profileIcon || photo,
        };
      }

      state.user = user;
    },

    logout: (state) => {
      console.log('userSlice - Logging out');
      state.user = null;
    },
  },
});

// Exporting actions
export const { setUser, logout } = userSlice.actions;
export const selectUser = (state) => state.user.user;

// Exporting the reducer
export default userSlice.reducer;


// // redux/userSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const userSlice = createSlice({
//   name: 'user', // The name of the slice
//   initialState: { user: null }, // The initial state of the slice

//   reducers: {
//     setUser: (state, action) => {
//       const user = { ...action.payload };
//       console.log('userSlice', user);
//       user.displayName = `${user?.basicInfo?.name}`
//       state.user = user;
//     },

//     // Action to set the user in the state
//     logout: (state) => {
//       localStorage.clear();
//       state.user = null
//     },
//     // Action to clear the user from the state
//   },
// });

// // Exporting actions
// export const { setUser, logout } = userSlice.actions;
// export const selectUser = (state) => state.user.user;
// // Exporting the reducer
// export default userSlice.reducer;
