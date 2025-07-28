import { View, Text, TextInput } from 'react-native'
import React from 'react'

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

const CustomInput = () => {
  return (
    <TextInput>

    </TextInput>
  )
}

export default CustomInput