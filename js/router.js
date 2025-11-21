/**
 * Router Module
 * Handles view switching and navigation state management
 */

/**
 * Switch to a specific view by hiding all views and showing the target view
 * @param {string} tabName - The name of the view to switch to ('stopwatch', 'pomodoro', 'history')
 */
export function switchTab(tabName) {
  // Validate view name
  const validViews = ['stopwatch', 'pomodoro', 'history'];
  if (!validViews.includes(tabName)) {
    console.warn(`Invalid view name: ${tabName}. Falling back to stopwatch.`);
    tabName = 'stopwatch';
  }

  // Hide all views by removing active class
  const allViews = document.querySelectorAll('.view');
  allViews.forEach(view => {
    view.classList.remove('active');
  });

  // Show target view by adding active class
  const targetView = document.querySelector(`.view[data-view="${tabName}"]`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    console.error(`View element not found for: ${tabName}`);
  }

  // Update navigation button states
  const allNavButtons = document.querySelectorAll('.nav-button');
  allNavButtons.forEach(button => {
    button.classList.remove('active');
  });

  // Add active class to corresponding navigation button
  const targetNavButton = document.querySelector(`.nav-button[data-view="${tabName}"]`);
  if (targetNavButton) {
    targetNavButton.classList.add('active');
  } else {
    console.error(`Navigation button not found for: ${tabName}`);
  }
}

/**
 * Initialize the router with a default view
 * @param {string} defaultTab - The default view to display on initialization
 */
export function initRouter(defaultTab = 'stopwatch') {
  // Switch to the default view
  switchTab(defaultTab);

  // Attach event listeners to navigation buttons
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const viewName = button.getAttribute('data-view');
      if (viewName) {
        switchTab(viewName);
      }
    });
  });
}
