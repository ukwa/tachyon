
document.onreadystatechange = function(){

	targetDateCalendar = flatpickr("#target-date", {
		dateFormat: "Z",
		altInput: true,
		enableTime: true,
		altFormat: 'J F Y h:i K' ,
		defaultDate: new Date(1996,0,1),
		inline: true
	});
	console.log(targetDateCalendar)

	$('.flatpickr-calendar').hide();

	$('#target-date-form input').click(function(e){
		$('.flatpickr-calendar').show();
	}).change(function(e){
		$('.flatpickr-calendar').hide();
		// Only do this when time-travel mode is engaged:
		if( $('#enable-timetravel').hasClass('disabled')) {
			$('#update-page').removeClass('disabled');
		}
	});

	$('#enable-timetravel').click(function(e){
		chrome.browserAction.setIcon({path:"icon-on.png"});
		$('#enable-timetravel').addClass('disabled');
		$('#disable-timetravel').removeClass('disabled');
		//$('#update-page').removeClass('disabled');
	});
	$('#disable-timetravel').click(function(e){
		chrome.browserAction.setIcon({path:"icon-off.png"});
		$('#enable-timetravel').removeClass('disabled');
		$('#disable-timetravel').addClass('disabled');
		$('#update-page').addClass('disabled');
	});
	$('#update-page').click(function(e){
		$('#update-page').addClass('disabled');
	});

	/*

  document.getElementById('set_target_time').onclick = function (){ 
    chrome.runtime.sendMessage({setTargetTime: true, targetTime: dtp.val() });
    self.close();
  };
  document.getElementById('disable_timetravel').onclick = function (){ 
    chrome.runtime.sendMessage({disengageTimeGate: true});
    self.close();
  };
  // Request the latest time:
  chrome.runtime.sendMessage({requestTargetTime: true});
  chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
    if (msg.showTargetTime) {
      console.log("Showing date "+msg.targetTime);
      dtp.datetimepicker('setDate', msg.targetTime);
    }
  });
	 */

};
