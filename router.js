// router.js - Navigation and tab switching logic

/**
 * Switches between different sections of the application
 * @param {string} tabName - The name of the tab to switch to ('stopwatch', 'pomodoro', or 'history')
 */
export function switchTab(tabName) {
  // Validate tab name
  const validTabs = ['stopwatch', 'pomodoro', 'history'];
  if (!validTabs.includes(tabName)) {
    console.warn(`Invalid tab name: "${tabName}". Valid tabs are: ${validTabs.join(', ')}`);
    return;
  }

  // Get all sections and navigation tabs
  const sections = document.querySelectorAll('.timer-section');
  const navTabs = document.querySelectorAll('.nav-tab');

  // Hide all sections
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Remove active state from all navigation tabs
  navTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Show the requested section
  const targetSection = document.getElementById(`section-${tabName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  } else {
    console.error(`Section not found: section-${tabName}`);
    return;
  }

  // Activate the corresponding navigation tab
  const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetTab) {
    targetTab.classList.add('active');
  } else {
    console.error(`Navigation tab not found for: ${tabName}`);
  }
}
