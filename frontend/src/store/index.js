import { configureStore } from '@reduxjs/toolkit'
import auctionReducer from './auctionSlice.js'

export const store = configureStore({
  reducer: {
    auction: auctionReducer,
  },
})

