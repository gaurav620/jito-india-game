'use client';

import React from 'react';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingBody}>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className="row">
            <div className={styles.topBar}>
              {/* @ts-expect-error Native HTML marquee tag */}
              <marquee>Entertainment Only</marquee>
            </div>
          </div>

          <div className={styles.logoRow}>
            <div className={styles.logoCol}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/khelo-jeeto-logo-animated.gif"
                width={463}
                height={316}
                alt="Khelo Jeeto Games"
                className={styles.logoImg}
              />
            </div>
          </div>

          <div className={styles.buttonsRow}>
            <div className={styles.buttonCol}>
              <a href="/Builds/KheloJeeto.exe" download className={styles.buttonLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/pc.png"
                  width={260}
                  height={100}
                  alt="Free Download For PC"
                  className={styles.buttonImg}
                />
              </a>
            </div>
            <div className={styles.buttonCol}>
              <a href="/Builds/KheloJeeto-Print.exe" download className={styles.buttonLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/print.png"
                  width={260}
                  height={100}
                  alt="Free Download For Print"
                  className={styles.buttonImg}
                />
              </a>
            </div>
            <div className={styles.buttonCol}>
              <a href="/Builds/KheloJeeto.apk" download className={styles.buttonLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/android.png"
                  width={260}
                  height={100}
                  alt="Free Download For Android"
                  className={styles.buttonImg}
                />
              </a>
            </div>
          </div>

          <div className={styles.bottomBarRow}>
            <div className={styles.bottomBarCol}>
              {/* @ts-expect-error Native HTML marquee tag */}
              <marquee>
                <span className={styles.bottomText}>khelojeeto.com</span>
              </marquee>
            </div>
          </div>

          <br />
          <br />
          <br />
        </div>
      </div>
    </div>
  );
}
