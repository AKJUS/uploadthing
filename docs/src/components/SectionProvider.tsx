"use client";

import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { remToPx } from "@/lib/remToPx";
import { createStore, useStore, type StoreApi } from "zustand";

export interface Section {
  id: string;
  title: string;
  offsetRem?: number;
  tag?: string;
  headingRef?: React.RefObject<HTMLHeadingElement>;
}

interface SectionState {
  sections: Array<Section>;
  visibleSections: Array<string>;
  setVisibleSections: (visibleSections: Array<string>) => void;
  registerHeading: ({
    id,
    ref,
    offsetRem,
  }: {
    id: string;
    ref: React.RefObject<HTMLHeadingElement>;
    offsetRem: number;
  }) => void;
}

function createSectionStore(sections: Array<Section>) {
  return createStore<SectionState>()((set) => ({
    sections,
    visibleSections: [],
    setVisibleSections: (visibleSections) =>
      set((state) =>
        state.visibleSections.join() === visibleSections.join()
          ? {}
          : { visibleSections },
      ),
    registerHeading: ({ id, ref, offsetRem }) =>
      set((state) => {
        return {
          sections: state.sections.map((section) => {
            if (section.id === id) {
              return {
                ...section,
                headingRef: ref,
                offsetRem,
              };
            }
            return section;
          }),
        };
      }),
  }));
}

function useVisibleSections(sectionStore: StoreApi<SectionState>) {
  let setVisibleSections = useStore(sectionStore, (s) => s.setVisibleSections);
  let sections = useStore(sectionStore, (s) => s.sections);

  useEffect(() => {
    function checkVisibleSections() {
      let { innerHeight, scrollY } = window;
      let newVisibleSections = [];

      for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
      ) {
        let { id, headingRef, offsetRem = 0 } = sections[sectionIndex];

        if (!headingRef?.current) {
          continue;
        }

        let offset = remToPx(offsetRem);
        let top = headingRef.current.getBoundingClientRect().top + scrollY;

        if (sectionIndex === 0 && top - offset > scrollY) {
          newVisibleSections.push("_top");
        }

        let nextSection = sections[sectionIndex + 1];
        let bottom =
          (nextSection?.headingRef?.current?.getBoundingClientRect().top ??
            Infinity) +
          scrollY -
          remToPx(nextSection?.offsetRem ?? 0);

        if (
          (top > scrollY && top < scrollY + innerHeight) ||
          (bottom > scrollY && bottom < scrollY + innerHeight) ||
          (top <= scrollY && bottom >= scrollY + innerHeight)
        ) {
          newVisibleSections.push(id);
        }
      }

      setVisibleSections(newVisibleSections);
    }

    const controller = new AbortController();
    let raf = window.requestAnimationFrame(() => checkVisibleSections());
    window.addEventListener("scroll", checkVisibleSections, {
      passive: true,
      signal: controller.signal,
    });
    window.addEventListener("resize", checkVisibleSections, {
      signal: controller.signal,
    });

    return () => {
      window.cancelAnimationFrame(raf);
      controller.abort();
    };
  }, [setVisibleSections, sections]);
}

const SectionStoreContext = createContext<StoreApi<SectionState> | null>(null);

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SectionProvider({
  sections,
  children,
}: {
  sections: Array<Section>;
  children: React.ReactNode;
}) {
  let [sectionStore] = useState(() => createSectionStore(sections));

  useVisibleSections(sectionStore);

  useIsomorphicLayoutEffect(() => {
    sectionStore.setState({ sections });
  }, [sectionStore, sections]);

  return (
    <SectionStoreContext.Provider value={sectionStore}>
      {children}
    </SectionStoreContext.Provider>
  );
}

export function useSectionStore<T>(selector: (state: SectionState) => T) {
  let store = use(SectionStoreContext);
  return useStore(store!, selector);
}
