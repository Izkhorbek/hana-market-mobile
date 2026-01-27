import { Logo } from "@/constants/icons"
import { ViewProps } from "react-native"

export const icons = {
  logo: Logo,
}

export const Icon = ({
  name,
  size,
  style,
}: {
  name: keyof typeof icons
  size: number
  style?: ViewProps['style']
}) => {
  const IconComponent = icons[name]
  return <IconComponent width={size} height={size} style={style} />
}