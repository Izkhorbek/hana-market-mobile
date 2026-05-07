import { Category } from '@/types';
import { ECategoryType } from './enums';

const withImageUrl = (
  category: Omit<Category, 'image_url'>,
): Category => ({
  ...category,
  image_url: '',
})

export const CATEGORIES: Category[] = [
  withImageUrl({ id: ECategoryType.ELECTRONICS, name_uz: 'Elektronika', name_ru: 'Электроника', parent_id: null, sort_order: 1, product_count: 0 }),
  withImageUrl({ id: ECategoryType.FURNITURE, name_uz: 'Mebel', name_ru: 'Мебель', parent_id: null, sort_order: 2, product_count: 0 }),
  withImageUrl({ id: ECategoryType.KIDS, name_uz: 'Bolalar uchun', name_ru: 'Детские товары', parent_id: null, sort_order: 3, product_count: 0 }),
  withImageUrl({ id: ECategoryType.WOMENS_CLOTHING, name_uz: 'Ayollar kiyimlari', name_ru: 'Женская одежда', parent_id: null, sort_order: 4, product_count: 0 }),
  withImageUrl({ id: ECategoryType.WOMENS_ACCESSORIES, name_uz: 'Ayollar aksessuarlari', name_ru: 'Женские аксессуары', parent_id: null, sort_order: 5, product_count: 0 }),
  withImageUrl({ id: ECategoryType.MENS_CLOTHING, name_uz: 'Erkaklar kiyimlari', name_ru: 'Мужская одежда', parent_id: null, sort_order: 6, product_count: 0 }),
  withImageUrl({ id: ECategoryType.HOME_APPLIANCES, name_uz: 'Maishiy texnika', name_ru: 'Бытовая техника', parent_id: null, sort_order: 7, product_count: 0 }),
  withImageUrl({ id: ECategoryType.HOME_AND_KITCHEN, name_uz: 'Uy va oshxona', name_ru: 'Дом и кухня', parent_id: null, sort_order: 8, product_count: 0 }),
  withImageUrl({ id: ECategoryType.SPORTS, name_uz: 'Sport va dam olish', name_ru: 'Спорт и отдых', parent_id: null, sort_order: 9, product_count: 0 }),
  withImageUrl({ id: ECategoryType.GAMES_AND_HOBBIES, name_uz: "O'yin va xobbi", name_ru: 'Игры и хобби', parent_id: null, sort_order: 10, product_count: 0 }),
  withImageUrl({ id: ECategoryType.CARS, name_uz: 'Avtomobillar', name_ru: 'Автомобили', parent_id: null, sort_order: 11, product_count: 0 }),
  withImageUrl({ id: ECategoryType.CAR_PARTS, name_uz: 'Avto qismlar', name_ru: 'Автоаксессуары', parent_id: null, sort_order: 12, product_count: 0 }),
  withImageUrl({ id: ECategoryType.REAL_ESTATE, name_uz: "Ko'chmas mulk va ijara", name_ru: 'Недвижимость и аренда', parent_id: null, sort_order: 13, product_count: 0 }),
  withImageUrl({ id: ECategoryType.BEAUTY, name_uz: "Go'zallik", name_ru: 'Красота', parent_id: null, sort_order: 14, product_count: 0 }),
  withImageUrl({ id: ECategoryType.PLANTS, name_uz: "O'simliklar", name_ru: 'Растения', parent_id: null, sort_order: 15, product_count: 0 }),
  withImageUrl({ id: ECategoryType.FOOD, name_uz: 'Oziq-ovqat', name_ru: 'Упакованные продукты', parent_id: null, sort_order: 16, product_count: 0 }),
  withImageUrl({ id: ECategoryType.HEALTH, name_uz: "Sog'liq uchun", name_ru: 'Биологически активные добавки', parent_id: null, sort_order: 17, product_count: 0 }),
  withImageUrl({ id: ECategoryType.PETS, name_uz: 'Uy hayvonlari uchun', name_ru: 'Товары для животных', parent_id: null, sort_order: 18, product_count: 0 }),
  withImageUrl({ id: ECategoryType.TICKETS, name_uz: 'Chipta va kuponlar', name_ru: 'Билеты и купоны', parent_id: null, sort_order: 19, product_count: 0 }),
  withImageUrl({ id: ECategoryType.BOOKS, name_uz: 'Kitoblar', name_ru: 'Книги', parent_id: null, sort_order: 20, product_count: 0 }),
  withImageUrl({ id: ECategoryType.KIDS_BOOKS, name_uz: 'Bolalar kitoblari', name_ru: 'Детские книги', parent_id: null, sort_order: 21, product_count: 0 }),
  withImageUrl({ id: ECategoryType.OTHER, name_uz: 'Boshqalar', name_ru: 'Другое', parent_id: null, sort_order: 22, product_count: 0 }),
  withImageUrl({ id: ECategoryType.WANTED, name_uz: 'Qidirilmoqda', name_ru: 'Ищу / Требуется', parent_id: null, sort_order: 23, product_count: 0 }),
  withImageUrl({ id: ECategoryType.BUY, name_uz: 'Sotib olaman', name_ru: 'Куплю', parent_id: null, sort_order: 24, product_count: 0 }),
]

export const getCategoryById = (id: number): Category | undefined =>
  CATEGORIES.find((cat) => cat.id === id)

export const getCategoryName = (id: number, lang: 'uz' | 'ru' = 'uz'): string => {
  const category = getCategoryById(id)
  if (!category) return ''
  return lang === 'ru' ? category.name_ru : category.name_uz
}
