import { create } from 'zustand'

interface Birthday {
  id: string
  name: string
  birthYear: number | null
  birthMonth: number
  birthDay: number
  calendarType: string
  department: string | null
  email: string | null
  phone: string | null
  notes: string | null
  advanceDays: number
  isActive: boolean
  nextBirthday: string
  nextBirthdayFormatted: string
  age: number | null
  daysUntil: number
  createdAt: string
  updatedAt: string
}

interface BirthdaysState {
  birthdays: Birthday[]
  upcoming: Birthday[]
  departments: string[]
  loading: boolean
  setBirthdays: (birthdays: Birthday[]) => void
  setUpcoming: (upcoming: Birthday[]) => void
  setDepartments: (departments: string[]) => void
  setLoading: (loading: boolean) => void
  addBirthday: (birthday: Birthday) => void
  updateBirthday: (id: string, birthday: Partial<Birthday>) => void
  removeBirthday: (id: string) => void
}

export const useBirthdaysStore = create<BirthdaysState>((set) => ({
  birthdays: [],
  upcoming: [],
  departments: [],
  loading: false,
  setBirthdays: (birthdays) => set({ birthdays }),
  setUpcoming: (upcoming) => set({ upcoming }),
  setDepartments: (departments) => set({ departments }),
  setLoading: (loading) => set({ loading }),
  addBirthday: (birthday) => set((state) => ({
    birthdays: [...state.birthdays, birthday]
  })),
  updateBirthday: (id, birthday) => set((state) => ({
    birthdays: state.birthdays.map((b) =>
      b.id === id ? { ...b, ...birthday } : b
    )
  })),
  removeBirthday: (id) => set((state) => ({
    birthdays: state.birthdays.filter((b) => b.id !== id)
  }))
}))
