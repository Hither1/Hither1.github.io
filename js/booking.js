(function () {
  'use strict';

  var card = document.querySelector('.booking-card');
  if (!card) return;

  var calendar = card.querySelector('.booking-calendar');
  var dates = card.querySelector('.booking-dates');
  var timeZone = card.dataset.bookingTimezone;

  // Treat calendar days as UTC dates after resolving "today" in the host's
  // timezone, so visitor timezones and daylight-saving changes cannot shift them.
  function todayInHostTimezone() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  }

  function addDays(date, count) {
    var result = new Date(date);
    result.setUTCDate(result.getUTCDate() + count);
    return result;
  }

  function formatDate(date, options) {
    return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: 'UTC' }, options)).format(date);
  }

  function renderCalendar() {
    var today = todayInHostTimezone();
    var mondayOffset = (today.getUTCDay() + 6) % 7;
    var first = addDays(today, -mondayOffset);
    var fragment = document.createDocumentFragment();

    for (var index = 0; index < 21; index += 1) {
      var date = addDays(first, index);
      var past = date < today;
      var day = document.createElement(past ? 'span' : 'a');
      var dateString = date.toISOString().slice(0, 10);
      var label = formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      var monthStart = date.getUTCDate() === 1;

      day.className = 'booking-date' + (past ? ' booking-date-past' : '') + (monthStart ? ' booking-date-month' : '');
      day.textContent = monthStart ? formatDate(date, { month: 'short', day: 'numeric' }) : String(date.getUTCDate());

      if (past) {
        day.setAttribute('aria-label', label + ', past date');
      } else {
        // These are date shortcuts, not cached availability. Calendly checks
        // conflicts and scheduling rules when the visitor opens a date.
        var url = new URL(card.dataset.bookingUrl);
        url.searchParams.set('month', dateString.slice(0, 7));
        url.searchParams.set('date', dateString);
        url.searchParams.set('timezone', timeZone);
        day.href = url.toString();
        day.target = '_blank';
        day.rel = 'noopener';
        day.setAttribute('aria-label', 'Check times for ' + label + ' in Eastern time on Calendly (opens in a new tab)');
        if (date.getTime() === today.getTime()) day.setAttribute('aria-current', 'date');
      }

      fragment.appendChild(day);
    }

    dates.replaceChildren(fragment);
    calendar.hidden = false;
  }

  // Refresh dates when returning to a tab that may have stayed open overnight.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) renderCalendar();
  });

  renderCalendar();
}());
