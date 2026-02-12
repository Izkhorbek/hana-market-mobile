import { fakeProducts } from '@/constants'
import { router } from 'expo-router'
import React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import ProductCard from '../shared/Cards/ProductCard'
import FilterButtons from './FilterButtons'

const ProductsList = () => {
  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      style={styles.container}
      data={fakeProducts}
      ListHeaderComponent={<FilterButtons />}
      renderItem={({ item, index }) => (
        <ProductCard
          {...item}
          onPress={() => router.push(`/product/${index + 1}`)}
        />
      )}
    />
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