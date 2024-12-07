document.addEventListener('DOMContentLoaded', () => {
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let history = JSON.parse(localStorage.getItem('history')) || {};
    const DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

    const habitsDiv = document.getElementById('habits');
    const addHabitBtn = document.getElementById('addHabit');
    const addHabitForm = document.getElementById('addHabitForm');
    const habitForm = document.getElementById('habitForm');
    const viewHistoryBtn = document.getElementById('viewHistory');
    const historyView = document.getElementById('historyView');

    // Initialize history view as hidden
    historyView.style.display = 'none';

	// Show form when clicking 'Add Habit'
    addHabitBtn.addEventListener('click', () => {
        addHabitForm.style.display = 'block';
    });

    // Handle form submission
    habitForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent form from actually submitting
        const name = document.getElementById('habitName').value;
        if (name) {
            habits.push({ name, status: false, lastChecked: null });
            saveHabits();
            renderHabits();
            this.reset(); // Reset form
            addHabitForm.style.display = 'none'; // Hide form after submission
        }
    });

    //addHabitBtn.addEventListener('click', addHabit);
    viewHistoryBtn.addEventListener('click', toggleHistoryView);

    function addHabit() {
        console.log("Add Habit function called"); // Add this line
        const name = prompt("Enter habit name:");
        if (name) {
            habits.push({ name, status: false, lastChecked: null });
            saveHabits();
            renderHabits();
        }
    }

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function saveHistory() {
        localStorage.setItem('history', JSON.stringify(history));
    }

    function deleteHabit(index) {
        habits.splice(index, 1); // Remove habit from array
        // Clean up history for this habit
        for (let date in history) {
            delete history[date][habits[index]?.name]; // Ensure we're not accessing undefined
        }
        saveHabits();
        saveHistory();
        renderHabits();
    }

    function resetDailyHabits() {
        const today = new Date().toDateString();
        habits.forEach(habit => {
            if (!habit.lastChecked || new Date(habit.lastChecked).toDateString() !== today) {
                habit.status = false;
                habit.lastChecked = new Date().toISOString();
            }
        });
        saveHabits();
    }

    function renderHabits() {
        resetDailyHabits();
        habitsDiv.innerHTML = '';
        habits.forEach((habit, index) => {
            const habitElement = document.createElement('div');
            habitElement.className = 'habit';
            habitElement.innerHTML = `
                <span>${habit.name}</span>
                <button onclick="toggleHabit(${index})">${habit.status ? 'Done' : 'Not Done'}</button>
                <button class="deleteHabit" data-index="${index}">X</button>
            `;
            // Use event delegation for delete button
            habitElement.querySelector('.deleteHabit').addEventListener('click', () => deleteHabit(index));
            habitsDiv.appendChild(habitElement);
        });
    }

    window.toggleHabit = function(index) {
        const habit = habits[index];
        const wasDone = habit.status;
        habit.status = !habit.status;
        const today = new Date().toDateString();
        if (!history[today]) history[today] = {};
        history[today][habit.name] = habit.status;

        // Check streaks only when marking as done
        if (habit.status) {
            checkStreaks(habit.name);
        }

        saveHabits();
        saveHistory();
        renderHabits();

        // Check if we're starting a new day where we've missed twice
        if (!wasDone && habit.status) {
            if (checkMissTwice(habit.name)) {
                alert(`Reminder: Never miss twice! Today is the day to get back on track with ${habit.name}.`);
            }
        }
    }

    function checkStreaks(habitName) {
        let streak = 0;
        let currentDay = new Date();
        while (true) {
            let dayString = currentDay.toDateString();
            if (!history[dayString] || !history[dayString][habitName]) break;
            streak++;
            currentDay = new Date(currentDay.getTime() - DAY);
        }
        if (streak > 1) alert(`Streak Alert: You have a ${streak}-day streak for ${habitName}!`);
    }

    function checkMissTwice(habitName) {
        let missedTwice = false;
        let currentDay = new Date();
        let missedCount = 0;
        for (let i = 0; i < 2; i++) {
            let dayString = currentDay.toDateString();
            if (!history[dayString] || !history[dayString][habitName]) {
                missedCount++;
            }
            if (missedCount === 2) {
                missedTwice = true;
                break;
            }
            currentDay = new Date(currentDay.getTime() - DAY);
        }
        return missedTwice;
    }

	function toggleHistoryView() {
        // Toggle display of history view
        if (historyView.style.display === 'none') {
            historyView.style.display = 'grid';
            renderHistoryView();
        } else {
            historyView.style.display = 'none';
        }
    }

	/*
    function renderHistoryView() {
        historyView.innerHTML = '';
        const now = new Date();
        const daysToShow = 7; // Show last 7 days
        const habitsToShow = habits.length; // Show all habits

        historyView.style.gridTemplateColumns = `120px repeat(${daysToShow}, 60px)`;
        historyView.style.gridTemplateRows = `auto repeat(${habitsToShow}, auto)`;

        // Add day labels above the grid, from oldest to newest (left to right)
        for (let dayOffset = daysToShow - 1; dayOffset >= 0; dayOffset--) {
            const day = new Date(now - (dayOffset * DAY));
            const dayLabel = document.createElement('div');
            dayLabel.className = 'historyLabel';
            dayLabel.textContent = day.toLocaleDateString('en-US', { weekday: 'short' });
            dayLabel.style.gridRow = 1;
            dayLabel.style.gridColumn = daysToShow - dayOffset + 1; // Reversed order: newest day on the right
            historyView.appendChild(dayLabel);
        }

        // Add habit names in the first column
        for (let i = 0; i < habitsToShow; i++) {
            const habitLabel = document.createElement('div');
            habitLabel.className = 'historyLabel';
            habitLabel.textContent = habits[i].name;
            habitLabel.style.gridColumn = 1;
            habitLabel.style.gridRow = i + 2; // +2 because row 1 is for day labels
            historyView.appendChild(habitLabel);

            // Fill in the grid for each habit on each day, from oldest to newest (left to right)
            for (let dayOffset = daysToShow - 1; dayOffset >= 0; dayOffset--) {
                const day = new Date(now - (dayOffset * DAY));
                const dayString = day.toDateString();
                const habit = habits[i].name;
                const historyItem = document.createElement('div');
                historyItem.className = 'historyItem ' + (history[dayString] && history[dayString][habit] ? 'done' : 'notDone');
                historyItem.style.gridRow = i + 2; // +2 because row 1 is for day labels
                historyItem.style.gridColumn = daysToShow - dayOffset + 1; // Reversed order: newest day on the right
                historyItem.textContent = ''; // Clearing any text content
                historyView.appendChild(historyItem);
            }
        }
    }
	*/
	function renderHistoryView() {
		historyView.innerHTML = '';
		const now = new Date();
		const daysToShow = 7; // Show last 7 days
		const habitsToShow = habits.length; // Show all habits

		historyView.style.gridTemplateColumns = `80px repeat(${daysToShow}, 40px)`;
		historyView.style.gridTemplateRows = `40px 20px repeat(${habitsToShow}, 40px)`; // Adjust for spacing

		// Add day labels above the grid, from oldest to newest (left to right)
		for (let dayOffset = daysToShow - 1; dayOffset >= 0; dayOffset--) {
			const day = new Date(now - (dayOffset * DAY));
			const dayLabel = document.createElement('div');
			dayLabel.className = 'historyLabel';
			dayLabel.textContent = day.toLocaleDateString('en-US', { weekday: 'short' });
			dayLabel.style.gridRow = 1;
			dayLabel.style.gridColumn = daysToShow - dayOffset + 1;
			historyView.appendChild(dayLabel);

			// Add date label under day name
			const dateLabel = document.createElement('div');
			dateLabel.className = 'dateLabel';
			dateLabel.textContent = `${day.getDate()} ${day.toLocaleDateString('en-US', { month: 'short' })}`;
			dateLabel.style.gridColumn = daysToShow - dayOffset + 1;
			historyView.appendChild(dateLabel);
		}

		// Add habit names in the first column
		for (let i = 0; i < habitsToShow; i++) {
			const habitLabel = document.createElement('div');
			habitLabel.className = 'historyLabel';
			habitLabel.textContent = habits[i].name;
			habitLabel.style.gridColumn = 1;
			habitLabel.style.gridRow = i + 3; // +3 because of day and date labels
			historyView.appendChild(habitLabel);

			// Fill in the grid for each habit on each day, from oldest to newest (left to right)
			for (let dayOffset = daysToShow - 1; dayOffset >= 0; dayOffset--) {
				const day = new Date(now - (dayOffset * DAY));
				const dayString = day.toDateString();
				const habit = habits[i].name;
				const historyItem = document.createElement('div');
				historyItem.className = 'historyItem ' + (history[dayString] && history[dayString][habit] ? 'done' : 'notDone');
				historyItem.style.gridRow = i + 3; // +3 because of day and date labels
				historyItem.style.gridColumn = daysToShow - dayOffset + 1;
				historyItem.textContent = ''; // Clearing any text content
				historyView.appendChild(historyItem);
			}
		}
	}
    renderHabits();
});
