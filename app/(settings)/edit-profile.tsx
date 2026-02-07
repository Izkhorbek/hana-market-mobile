import FormInput from '@/components/FormElements/FormInput'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { ArrowLeft, Camera, Check, User } from 'lucide-react-native'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

// Form data interface for type safety
interface EditProfileFormData {
	firstName: string
	lastName: string
	profileImage: string | null
}

// API response interface (for backend integration)
interface UpdateProfileResponse {
	success: boolean
	message?: string
	data?: {
		id: string
		firstName: string
		lastName: string
		profileImage: string | null
	}
}

const EditProfilePage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [isSaving, setIsSaving] = useState(false)

	// Initialize react-hook-form with default values
	// In real app, these would come from user context/API
	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<EditProfileFormData>({
		defaultValues: {
			firstName: 'John',
			lastName: 'Doe',
			profileImage: null,
		},
	})

	// Watch profile image for display
	const profileImage = watch('profileImage')

	const handleGoBack = () => {
		if (isDirty) {
			Alert.alert(
				t('edit_profile.unsaved_changes'),
				t('edit_profile.unsaved_changes_message'),
				[
					{ text: t('edit_profile.cancel'), style: 'cancel' },
					{ text: t('edit_profile.discard'), style: 'destructive', onPress: () => router.back() },
				]
			)
		} else {
			router.back()
		}
	}

	const handlePickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

		if (status !== 'granted') {
			Alert.alert(t('edit_profile.permission_denied'), t('edit_profile.photo_permission_message'))
			return
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		})

		if (!result.canceled && result.assets[0]) {
			setValue('profileImage', result.assets[0].uri, { shouldDirty: true })
		}
	}

	// API call function - ready for backend integration
	const updateProfile = async (data: EditProfileFormData): Promise<UpdateProfileResponse> => {
		// TODO: Replace with actual API call
		// Example implementation:
		// const formData = new FormData()
		// formData.append('firstName', data.firstName)
		// formData.append('lastName', data.lastName)
		// if (data.profileImage) {
		//   const imageUri = data.profileImage
		//   const filename = imageUri.split('/').pop() || 'profile.jpg'
		//   const match = /\.(\w+)$/.exec(filename)
		//   const type = match ? `image/${match[1]}` : 'image/jpeg'
		//   formData.append('profileImage', { uri: imageUri, name: filename, type } as any)
		// }
		// 
		// const response = await fetch('YOUR_API_URL/profile', {
		//   method: 'PUT',
		//   headers: {
		//     'Authorization': `Bearer ${token}`,
		//   },
		//   body: formData,
		// })
		// return response.json()

		// Simulated API call
		await new Promise(resolve => setTimeout(resolve, 500))

		console.log('Profile data to send:', {
			firstName: data.firstName,
			lastName: data.lastName,
			profileImage: data.profileImage,
		})

		return {
			success: true,
			message: 'Profile updated successfully',
			data: {
				id: '1',
				firstName: data.firstName,
				lastName: data.lastName,
				profileImage: data.profileImage,
			},
		}
	}

	// Form submission handler
	const onSubmit = async (data: EditProfileFormData) => {
		setIsSaving(true)
		try {
			const response = await updateProfile(data)

			if (response.success) {
				Alert.alert(t('edit_profile.success'), t('edit_profile.profile_saved'), [
					{ text: 'OK', onPress: () => router.back() },
				])
			} else {
				Alert.alert(t('edit_profile.error'), response.message || t('edit_profile.save_error'))
			}
		} catch (error) {
			console.error('Error updating profile:', error)
			Alert.alert(t('edit_profile.error'), t('edit_profile.save_error'))
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{
						backgroundColor: colors.background,
						borderBottomColor: colors.borderColor,
					},
				]}
			>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('edit_profile.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* Profile Photo Card */}
					<View style={[styles.card, { backgroundColor: colors.background }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('edit_profile.profile_photo')}
						</Text>

						<View style={styles.photoContainer}>
							<TouchableOpacity
								style={styles.photoWrapper}
								onPress={handlePickImage}
								activeOpacity={0.8}
							>
								{profileImage ? (
									<Image source={{ uri: profileImage }} style={styles.profileImage} />
								) : (
									<View
										style={[styles.placeholderImage, { backgroundColor: colors.primaryColor }]}
									>
										<User size={48} color='#fff' strokeWidth={1.5} />
									</View>
								)}

								{/* Camera Icon Badge */}
								<View
									style={[
										styles.cameraIconBadge,
										{ backgroundColor: colors.background, borderColor: colors.borderColor },
									]}
								>
									<Camera size={14} color={colors.primaryColor} />
								</View>
							</TouchableOpacity>

							<Text style={[styles.photoHint, { color: colors.textMuted }]}>
								{t('edit_profile.photo_hint')}
							</Text>
						</View>
					</View>

					{/* Personal Information Card */}
					<View style={[styles.card, { backgroundColor: colors.background }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('edit_profile.personal_info')}
						</Text>

						{/* First Name */}
						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='firstName'
								label={t('edit_profile.first_name')}
								placeholder={t('edit_profile.first_name_placeholder')}
								required
								rules={{
									required: t('edit_profile.errors.first_name_required'),
									minLength: {
										value: 2,
										message: t('edit_profile.errors.first_name_min'),
									},
									maxLength: {
										value: 50,
										message: t('edit_profile.errors.first_name_max'),
									},
								}}
								autoCapitalize='words'
								autoCorrect={false}
							/>
						</View>

						{/* Last Name */}
						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='lastName'
								label={t('edit_profile.last_name')}
								placeholder={t('edit_profile.last_name_placeholder')}
								required
								rules={{
									required: t('edit_profile.errors.last_name_required'),
									minLength: {
										value: 2,
										message: t('edit_profile.errors.last_name_min'),
									},
									maxLength: {
										value: 50,
										message: t('edit_profile.errors.last_name_max'),
									},
								}}
								autoCapitalize='words'
								autoCorrect={false}
							/>
						</View>
					</View>

					{/* Info Note Card */}
					<View
						style={[
							styles.noteCard,
							{
								backgroundColor: colors.infoCardBg,
								borderColor: colors.infoCardBorder,
							},
						]}
					>
						<Text style={[styles.noteTitle, { color: colors.infoCardText }]}>
							{t('edit_profile.note_title')}
						</Text>
						<Text style={[styles.noteText, { color: colors.infoCardText }]}>
							{t('edit_profile.note_text')}
						</Text>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={[styles.bottomContainer, { backgroundColor: colors.profileBackground }]}>
					<TouchableOpacity
						style={[
							styles.saveButton,
							{ backgroundColor: colors.primaryColor },
							(isSaving || !isDirty) && styles.saveButtonDisabled,
						]}
						onPress={handleSubmit(onSubmit)}
						disabled={isSaving || !isDirty}
						activeOpacity={0.8}
					>
						<Check size={20} color='#fff' />
						<Text style={styles.saveButtonText}>
							{isSaving ? t('edit_profile.saving') : t('edit_profile.save_changes')}
						</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</View>
	)
}

export default EditProfilePage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	headerRight: {
		width: 40,
	},
	keyboardView: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 24,
	},
	card: {
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 20,
	},
	photoContainer: {
		alignItems: 'center',
	},
	photoWrapper: {
		position: 'relative',
		marginBottom: 12,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
	},
	placeholderImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cameraIconBadge: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
	},
	photoHint: {
		fontSize: 13,
		textAlign: 'center',
	},
	inputGroup: {
		marginBottom: 16,
	},
	noteCard: {
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
	},
	noteTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	noteText: {
		fontSize: 13,
		lineHeight: 20,
	},
	bottomContainer: {
		padding: 16,
		paddingBottom: Platform.OS === 'ios' ? 34 : 16,
	},
	saveButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	saveButtonDisabled: {
		opacity: 0.7,
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
})
