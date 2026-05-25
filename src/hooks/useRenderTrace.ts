"use client";

import { useRef, useEffect } from 'react';

export function useRenderTrace(componentName: string, props: any = {}) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  renderCount.current += 1;

  useEffect(() => {
    const changedProps = Object.keys(props).reduce((ps, k) => {
      if (prevProps.current[k] !== props[k]) {
        ps[k] = [prevProps.current[k], props[k]];
      }
      return ps;
    }, {} as any);

    if (Object.keys(changedProps).length > 0) {
      console.log(`[RENDER TRACE] ${componentName} rendered ${renderCount.current} times. Changed props:`, changedProps);
    } else {
      console.log(`[RENDER TRACE] ${componentName} rendered ${renderCount.current} times. (State or Parent change)`);
    }

    prevProps.current = props;
  });

  return renderCount.current;
}
