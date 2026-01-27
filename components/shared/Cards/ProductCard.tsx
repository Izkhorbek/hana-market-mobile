import { Colors } from '@/constants/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ProductCardProps {
  image: string
  title: string
  distance: string
  time: string
  address: string
  price: string
  likes: number
  onPress?: () => void
  onDotsPress?: () => void
  onHeartPress?: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  distance,
  time,
  address,
  price,
  likes,
  onPress,
  onDotsPress,
  onHeartPress,
}) => {
  const colors = Colors.light

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: colors.borderColor }]}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <TouchableOpacity onPress={onPress}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Header with Title and Dots */}
        <View style={styles.header} >

          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <TouchableOpacity onPress={onDotsPress} style={styles.dotsButton}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={20}
              color={colors.subText}
            />
          </TouchableOpacity>
        </View>

        {/* Location and Time Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={14} color={colors.subText} />
            <Text style={[styles.infoText, { color: colors.subText }]}>
              {distance}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={colors.subText} />
            <Text style={[styles.infoText, { color: colors.subText }]}>
              {time}
            </Text>
          </View>
        </View>

        {/* Address */}
        <Text
          style={[styles.address, { color: colors.subText }]}
          numberOfLines={1}
        >
          {address}
        </Text>

        {/* Price and Likes Row */}
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.text }]}>
            {price}
          </Text>
          <TouchableOpacity onPress={onHeartPress} style={styles.likesContainer}>
            <Ionicons name="heart" size={18} color={colors.subText} />
            <Text style={[styles.likesText, { color: colors.subText }]}>
              {likes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',  
    borderBottomWidth: 1,
    overflow: 'hidden',
    borderColor: Colors.light.borderColor,
    marginVertical: 6,
    marginHorizontal: 12,
  },
  image: {
    width: 120,
    height: 130,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  dotsButton: {
    padding: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
  },
  address: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '400',
  },
})

export default ProductCard