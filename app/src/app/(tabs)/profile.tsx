import { View, Text } from 'react-native'
import React from 'react'
import Loader from '@/components/sub/Loader'

const profile = () => {
  return (
    <View className='bg-primary min-h-[100vh]'>
      <Text>profile</Text>
      <Loader />
    </View>
  )
}

export default profile