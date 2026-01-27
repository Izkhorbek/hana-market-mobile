import { fakeProducts } from '@/constants'
import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ProductCard from '../shared/Cards/ProductCard'

const ProductsList = () => {
  return (
    <FlatList showsVerticalScrollIndicator={false} style={styles.container} data={fakeProducts} renderItem={({ item }) => <ProductCard {...item} />} />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    width: '100%',
  }
})

export default ProductsList