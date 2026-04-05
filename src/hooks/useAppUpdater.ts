import { useEffect } from 'react';
import { check, type DownloadEvent } from '@tauri-apps/plugin-updater';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export function useAppUpdater() {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const update = await check();
        if (update) {
          console.log(
            `found update ${update.version} from ${update.date} with body ${update.body}`
          );
          let downloaded = 0;
          let contentLength = 0;

          const yes = await ask(
            `A new version (${update.version}) is available. Would you like to update now?`,
            {
              title: 'Update Available',
              kind: 'info',
              okLabel: 'Update',
              cancelLabel: 'Later',
            }
          );

          if (yes) {
            await update.downloadAndInstall((event: DownloadEvent) => {
              switch (event.event) {
                case 'Started':
                  contentLength = event.data.contentLength || 0;
                  console.log(`started downloading ${contentLength} bytes`);
                  break;
                case 'Progress':
                  downloaded += event.data.chunkLength;
                  console.log(`downloaded ${downloaded} from ${contentLength}`);
                  break;
                case 'Finished':
                  console.log('download finished');
                  break;
              }
            });

            await message('Update installed successfully. The application will now restart.', {
                title: 'Update Complete',
                kind: 'info',
            });
            
            await relaunch();
          }
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check for updates on mount
    checkUpdate();

    // Optionally set up an interval to check periodically
    const interval = setInterval(checkUpdate, 1000 * 60 * 60 * 4); // Every 4 hours

    return () => clearInterval(interval);
  }, []);
}

