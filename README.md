# Productivity Timer Suite
This project is a small web-based “Productivity Timers Suite” that combines a Stopwatch, a Pomodoro Timer, and a simple settings panel for customizing session durations. The whole app is built using HTML, CSS, and JavaScript only, without any external frameworks.

I built this to practice structuring a clean front-end project, handling time-based functions in JavaScript, and organizing code in a simple, modular way.

Features

Stopwatch Start, pause, and reset the stopwatch Millisecond-level timing Lap recording List of laps displayed in order
The stopwatch is useful for timing activities, study sessions, or tracking small tasks.

Pomodoro Timer Default 25-minute work timer + 5-minute break Editable work and break duration Start, pause, and reset controls Session history to track completed cycles
This helps maintain a study/work rhythm using the Pomodoro technique.

Session Settings Change work duration Change break duration Apply settings without refreshing the page
A simple settings panel lets the user adjust the timer based on preference.

How It Works:-

Stopwatch Uses setInterval to update time every 10ms Tracks hours, minutes, seconds, and milliseconds Stores lap times in an array and displays them in a list

Pomodoro Timer Converts minutes into seconds and counts down When work timer ends → break timer starts Tracks completed Pomodoro cycles Saves history in the browser during the session

Tech Stack HTML → Structure and layout CSS → Styling, layout, responsiveness JavaScript → All timing logic, event handling, and data updates

No libraries, no frameworks. Everything is built from scratch.

These concepts helped me understand JavaScript much better. The project also allowed me to practice building a clean UI without relying on frameworks.

Future Improvements (If time allows) Light/Dark mode toggle Sound notifications for timer completion LocalStorage saving of settings Small animations for transitions A summary dashboard for completed sessions

How to Run the Project

Just open the index.html file in any browser. No installation or setup required.