'use client';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslationSettings } from '@gitroom/react/translation/get.transation.service.client';
import useCookie from 'react-use-cookie';

export const HtmlComponent: FC = () => {
  const settings = useTranslationSettings();
  const [dir, setDir] = useState(settings.dir());
  const [mode] = useCookie('mode', 'light'); // Default to light mode

  useEffect(() => {
    settings.on('languageChanged', (lng) => {
      setDir(settings.dir());
    });
  }, []);

  useEffect(() => {
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('dir', dir);
    }
  }, [dir]);

  // Force light mode on mount and ensure body has correct class
  useEffect(() => {
    const body = document.body;
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
    }
  }, []);

  // Also apply mode from cookie
  useEffect(() => {
    const body = document.body;
    if (body && mode) {
      body.classList.remove('dark', 'light');
      body.classList.add(mode);
    }
  }, [mode]);

  return null;
};
