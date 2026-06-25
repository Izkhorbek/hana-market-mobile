import {
	useDeleteAccountMutation,
	useProfileQuery,
	useUpdateProfileMutation,
	useUploadProfileImageMutation,
} from '@/api/hooks'
import FormInput from '@/components/FormElements/FormInput'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import RemoteImage from '@/components/shared/RemoteImage'
import ThemedScrollView from '@/components/themed-scrollview'
import { AppLimits } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { ArrowLeft, Camera, Check, Trash2, User } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	ActivityIndicator,
	Alert,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface EditProfileFormData {
	username: string
	first_name: string
	last_name: string
	email: string
	bio: string
}

const EditProfilePage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const queryClient = useQueryClient()
	const logout = useAuthStore((s) => s.logout)
	const { isKeyboardVisible } = useKeyboardHeight()
	const insets = useSafeAreaInsets()
	
	// Displayed profile image URL (from server or just-uploaded URL)
	const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null)

	// ── API hooks ─────────────────────────────────────────────────────────────
	const { data: profileRes, isLoading: profileLoading } = useProfileQuery()
	const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation()
	const { mutate: uploadImage, isPending: isUploadingImage } = useUploadProfileImageMutation()
	const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccountMutation()

	const user = profileRes?.data?.data

	// ── Form ─────────────────────────────────────────────────────────────────
	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<EditProfileFormData>({
		defaultValues: {
			username: '',
			first_name: '',
			last_name: '',
			email: '',
			bio: '',
		},
	})

	// Seed form & display image once user data loads
	useEffect(() => {
		if (user) {
			reset({
				username: user.username ?? '',
				first_name: user.first_name ?? '',
				last_name: user.last_name ?? '',
				email: user.email ?? '',
				bio: user.bio ?? '',
			})
			setDisplayImageUrl(user.profile_image_url ?? null)
		}
	}, [reset, user])

	// ── Navigation ────────────────────────────────────────────────────────────
	const handleGoBack = () => {
		if (isDirty) {
			Alert.alert(
				t('edit_profile.unsaved_changes'),
				t('edit_profile.unsaved_changes_message'),
				[
					{ text: t('edit_profile.cancel'), style: 'cancel' },
					{ text: t('edit_profile.discard'), style: 'destructive', onPress: () => router.back() },
				],
			)
		} else {
			router.back()
		}
	}

	// ── Image picker — uploads immediately on pick ───────────────────────────
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
			const asset = result.assets[0]

			// Get file info
			const filename = asset.uri.split('/').pop() ?? 'profile.jpg'
			const ext = filename.split('.').pop() ?? 'jpg'
			const mimeType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`

			// Validate type
			if (!AppLimits.Image.ALLOWED_CONTENT_TYPES.includes(mimeType as any) ||
				!AppLimits.Image.ALLOWED_FILE_EXTENSIONS.includes(`${ext.toLowerCase()}` as any)) {
				Alert.alert(
					t('edit_profile.error'),
					t('edit_profile.invalid_image_type'),
				)
				return
			}

			// Validate size
			try {
				const response = await fetch(asset.uri)
				const blob = await response.blob()

				if (blob.size > AppLimits.Image.MAX_FILE_SIZE_BYTES) {
					Alert.alert(
						t('edit_profile.error'),
						t('edit_profile.image_too_large'),
					)
					return
				}
			} catch (error) {
				console.error('Error validating image size:', error)
			}

			// Show local preview immediately
			setDisplayImageUrl(asset.uri)

			// Upload now — field name must be "image"
			const formData = new FormData()

			formData.append('image', {
				uri: asset.uri,
				name: filename,
				type: mimeType,
			} as any)

			uploadImage(formData, {
				onSuccess: (res) => {
					const newUrl = res.data?.data ?? null
					// Replace local preview with the server URL so RemoteImage loads from server
					if (newUrl) setDisplayImageUrl(newUrl)
					queryClient.invalidateQueries({ queryKey: ['USER_PROFILE'] })
				},
				onError: () => {
					// Revert preview back to the original server image
					setDisplayImageUrl(user?.profile_image_url ?? null)
					Alert.alert(t('edit_profile.error'), t('edit_profile.save_error'))
				},
			})
		}
	}

	// ── Submit: only update profile text fields (image already uploaded) ──────
	const onSubmit = (data: EditProfileFormData) => {
		updateProfile(
			{
				username: data.username || undefined,
				first_name: data.first_name || undefined,
				last_name: data.last_name || undefined,
				email: data.email || undefined,
				bio: data.bio || undefined,
			},
			{
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ['USER_PROFILE'] })
					Alert.alert(t('edit_profile.success'), t('edit_profile.profile_saved'), [
						{ text: 'OK', onPress: () => router.back() },
					])
				},
				onError: () => {
					Alert.alert(t('edit_profile.error'), t('edit_profile.save_error'))
				},
			},
		)
	}

	// ── Delete account ────────────────────────────────────────────────────────
	const handleDeleteAccount = () => {
		Alert.alert(
			t('edit_profile.delete_account'),
			t('edit_profile.delete_account_confirm'),
			[
				{ text: t('edit_profile.cancel'), style: 'cancel' },
				{
					text: t('edit_profile.delete'),
					style: 'destructive',
					onPress: () => {
						deleteAccount(undefined, {
							onSuccess: async () => {
								// Await the durable keychain clear before navigating (M2).
								await logout()
								router.replace('/(auth)/auth')
							},
							onError: () => {
								Alert.alert(t('edit_profile.error'), t('edit_profile.save_error'))
							},
						})
					},
				},
			],
		)
	}

	const isBusy = isUpdating || isUploadingImage || isDeleting

	// ── Loading skeleton ──────────────────────────────────────────────────────
	if (profileLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
				<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor}]}>
					<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
						<ArrowLeft size={24} color={colors.text} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.text }]}>{t('edit_profile.title')}</Text>
					<View style={styles.headerRight} />
				</View>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color={colors.primaryColor} />
				</View>
			</View>
		)
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('edit_profile.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			<KeyboardAvoidWrapper style={styles.keyboardView}>
				<ThemedScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					withSafeBottom
				>
					{/* <ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					> */}
					{/* Profile Photo Card */}
					<View style={[styles.card, { backgroundColor: colors.profileCard }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('edit_profile.profile_photo')}
						</Text>
						<View style={styles.photoContainer}>
							<TouchableOpacity style={styles.photoWrapper} onPress={handlePickImage} activeOpacity={0.8} disabled={isBusy}>
								{displayImageUrl ? (
									<RemoteImage
										src={displayImageUrl}
										style={styles.profileImage}
										resizeMode='cover'
									/>
								) : (
									<View style={[styles.placeholderImage, { backgroundColor: colors.primaryColor }]}>
										<User size={48} color='#fff' strokeWidth={1.5} />
									</View>
								)}
								{/* Upload spinner overlay */}
								{isUploadingImage && (
									<View style={styles.imageOverlay}>
										<ActivityIndicator color='#fff' />
									</View>
								)}
								{/* Camera badge */}
								<View style={[styles.cameraIconBadge, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
									<Camera size={14} color={colors.primaryColor} />
								</View>
							</TouchableOpacity>
							<Text style={[styles.photoHint, { color: colors.textMuted }]}>
								{t('edit_profile.photo_hint')}
							</Text>
						</View>
					</View>

					{/* Personal Information Card */}
					<View style={[styles.card, { backgroundColor: colors.profileCard }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('edit_profile.personal_info')}
						</Text>

						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='username'
								label={t('edit_profile.username')}
								placeholder={t('edit_profile.username_placeholder')}
								autoCapitalize='none'
								autoCorrect={false}
							/>
						</View>

						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='first_name'
								label={t('edit_profile.first_name')}
								placeholder={t('edit_profile.first_name_placeholder')}
								rules={{
									minLength: { value: 2, message: t('edit_profile.errors.first_name_min') },
									maxLength: { value: 50, message: t('edit_profile.errors.first_name_max') },
								}}
								autoCapitalize='words'
								autoCorrect={false}
							/>
						</View>

						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='last_name'
								label={t('edit_profile.last_name')}
								placeholder={t('edit_profile.last_name_placeholder')}
								rules={{
									minLength: { value: 2, message: t('edit_profile.errors.last_name_min') },
									maxLength: { value: 50, message: t('edit_profile.errors.last_name_max') },
								}}
								autoCapitalize='words'
								autoCorrect={false}
							/>
						</View>

						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='email'
								label={t('edit_profile.email')}
								placeholder={t('edit_profile.email_placeholder')}
								keyboardType='email-address'
								autoCapitalize='none'
								autoCorrect={false}
							/>
						</View>

						<View style={styles.inputGroup}>
							<FormInput
								control={control}
								name='bio'
								label={t('edit_profile.bio')}
								placeholder={t('edit_profile.bio_placeholder')}
								type='textarea'
								rows={3}
								autoCorrect={false}
							/>
						</View>
					</View>

					{/* Info Note Card */}
					<View style={[styles.noteCard, { backgroundColor: colors.infoCardBg, borderColor: colors.infoCardBorder }]}>
						<Text style={[styles.noteTitle, { color: colors.infoCardText }]}>
							{t('edit_profile.note_title')}
						</Text>
						<Text style={[styles.noteText, { color: colors.infoCardText }]}>
							{t('edit_profile.note_text')}
						</Text>
					</View>

					{/* Danger Zone — Delete Account */}
					<TouchableOpacity
						style={[styles.deleteButton, { borderColor: colors.destructive ?? '#ef4444' }]}
						onPress={handleDeleteAccount}
						disabled={isBusy}
						activeOpacity={0.8}
					>
						{isDeleting ? (
							<ActivityIndicator size='small' color={colors.destructive ?? '#ef4444'} />
						) : (
							<Trash2 size={18} color={colors.destructive ?? '#ef4444'} />
						)}
						<Text style={[styles.deleteButtonText, { color: colors.destructive ?? '#ef4444' }]}>
							{t('edit_profile.delete_account')}
						</Text>
					</TouchableOpacity>
					{/* </ScrollView> */}

					{/* Save Button */}
					<View style={[styles.bottomContainer, { backgroundColor: colors.profileBackground }]}>
						<TouchableOpacity
							style={[
								styles.saveButton,
								{ backgroundColor: colors.primaryColor },
								(isBusy || !isDirty) && styles.saveButtonDisabled,
							]}
							onPress={handleSubmit(onSubmit)}
							disabled={isBusy || !isDirty}
							activeOpacity={0.8}
						>
							{isBusy ? (
								<ActivityIndicator size='small' color='#fff' />
							) : (
								<Check size={20} color='#fff' />
							)}
							<Text style={styles.saveButtonText}>
								{isBusy ? t('edit_profile.saving') : t('edit_profile.save_changes')}
							</Text>
						</TouchableOpacity>
					</View>
				</ThemedScrollView>
			</KeyboardAvoidWrapper>
		</View>
	)
}

export default EditProfilePage

const styles = StyleSheet.create({
	container: { flex: 1 },
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	headerTitle: { fontSize: 18, fontWeight: '600' },
	headerRight: { width: 40 },
	keyboardView: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent:
	{
		padding: 10,
	},
	card: { borderRadius: 16, padding: 20, marginBottom: 16 },
	cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 20 },
	photoContainer: { alignItems: 'center' },
	photoWrapper: { position: 'relative', marginBottom: 12 },
	profileImage: { width: 100, height: 100, borderRadius: 50 },
	placeholderImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageOverlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 50,
		backgroundColor: 'rgba(0,0,0,0.4)',
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
	photoHint: { fontSize: 13, textAlign: 'center' },
	inputGroup: { marginBottom: 16 },
	noteCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
	noteTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
	noteText: { fontSize: 13, lineHeight: 20 },
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 14,
		borderRadius: 12,
		borderWidth: 1.5,
		marginBottom: 8,
	},
	deleteButtonText: { fontSize: 15, fontWeight: '600' },
	bottomContainer: {
	},
	saveButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	saveButtonDisabled: { opacity: 0.6 },
	saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
