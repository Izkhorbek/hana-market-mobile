// Reactotron global — available in DEV only
import Reactotron from 'reactotron-react-native'

declare module '*.png' {
	const value: any
	export default value
}
interface Console {
	tron: typeof Reactotron
}

declare module '*.jpg' {
	const value: any
	export default value
}

declare module '*.jpeg' {
	const value: any
	export default value
}

declare module '*.gif' {
	const value: any
	export default value
}

declare module '*.svg' {
	import React from 'react'
    import { SvgProps } from 'react-native-svg'
	const content: React.FC<SvgProps>
	export default content
}
