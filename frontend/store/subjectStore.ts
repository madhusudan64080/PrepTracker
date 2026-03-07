// frontend/store/subjectStore.ts

import { create } from "zustand";
import { subjectService } from "@/lib/apiServices";

export interface Subject {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  totalTopics?: number;
  completedTopics?: number;
  isArchived?: boolean;
}

interface SubjectState {
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
  selectedSubjectId: string | null;

  fetchSubjects: () => Promise<void>;
  addSubject: (data: { name: string; color?: string; icon?: string; description?: string }) => Promise<Subject | null>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  setSelected: (id: string) => void;
}

export const subjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  isLoading: false,
  error: null,
  selectedSubjectId: null,

  fetchSubjects: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await subjectService.getAll();
      const data = res.data?.data || res.data || [];

      set({
        subjects: Array.isArray(data) ? data : [],
        isLoading: false
      });
    } catch (err) {
      set({
        error: "Failed to load subjects",
        isLoading: false
      });
    }
  },

  addSubject: async (data) => {
    const tempId = `temp-${Date.now()}`;

    set({
      subjects: [...get().subjects, { _id: tempId, ...data }]
    });

    try {
      const res = await subjectService.create(data);
      const created = res.data?.data || res.data;

      set({
        subjects: get().subjects.map(s =>
          s._id === tempId ? created : s
        )
      });

      return created;
    } catch {
      set({
        subjects: get().subjects.filter(s => s._id !== tempId)
      });
      return null;
    }
  },

  updateSubject: async (id, data) => {
    const prev = get().subjects;

    set({
      subjects: prev.map(s =>
        s._id === id ? { ...s, ...data } : s
      )
    });

    try {
      await subjectService.update(id, data);
    } catch {
      set({ subjects: prev });
    }
  },

  deleteSubject: async (id) => {
    const prev = get().subjects;

    set({
      subjects: prev.filter(s => s._id !== id)
    });

    try {
      await subjectService.delete(id);
    } catch {
      set({ subjects: prev });
    }
  },

  setSelected: (id) =>
    set({ selectedSubjectId: id })
}));
