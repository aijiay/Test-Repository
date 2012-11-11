var tweetCount = 100;
var callCount = 0;
var divID = ['#compatabilityData', '#followersData', '#followingData', '#hashtagData', '#mentionData', '#locationData'];
var jaccardIndex = 0;

//user object
function User(username) {
	this.username = username;
	this.followers = [];
	this.following = [];
	this.hashtags = [];
	this.mentions = [];
	this.locations = [];
	this.timelineURL = 'https://api.twitter.com/1/statuses/user_timeline.json?screen_name=' + this.username + '&count='+ tweetCount +'&include_entities=true&callback=?';
	
	this.setUsername = function(username){
		this.username = username;
		this.timelineURL = 'https://api.twitter.com/1/statuses/user_timeline.json?screen_name=' + this.username + '&count='+ tweetCount +'&include_entities=true&callback=?';
	}
};

$(function() {
	
	var user1, user2, locations, followers, following;
	
	//get the scroll position to dynamically fix the header as the user scrolls
	$(window).scroll(function(){		
		if(window.pageYOffset >= 649){
			$('#formContainer').addClass('fixed');
			$('#contentContainer').css('margin-top', 290)
		}
		else{
			$('#formContainer').removeClass('fixed');
			$('#contentContainer').css('margin-top', 0)
		}
		
	});
	
	//get user data
	$('#form').on('submit', function(e){
		e.preventDefault();
		callCount = 0;
		
		user1 = new User($('#user1').val());
		user2 = new User($('#user2').val());
		
		locations = [];
		followers = [];
		following = [];
		
		//get user1's data
		$.getJSON(user1.timelineURL, function(json){
			//console.log(json);
			for(var i =0; i < json.length; i++){
				
				if(json[i].entities.hashtags.length != 0){
					for(j=0; j < json[i].entities.hashtags.length; j++){
						user1.hashtags.push(json[i].entities.hashtags[j].text);
					}
				}

				if(json[i].entities.user_mentions.length != 0){
					for(j=0; j < json[i].entities.user_mentions.length; j++){
						user1.mentions.push(json[i].entities.user_mentions[j].screen_name);
					}
				}
				
				if(json[i].place){
					user1.locations.push(json[i].place.full_name);
				}
			}
			callCount++;
			compute();
		});
		
		//get user2's data
		$.getJSON(user2.timelineURL, function(json){
			//console.log(json);
			for(var i = 0; i < json.length; i++){
				
				if(json[i].entities.hashtags.length != 0){
					for(j=0; j < json[i].entities.hashtags.length; j++){
						user2.hashtags.push(json[i].entities.hashtags[j].text);
					}
				}
					
				if(json[i].entities.user_mentions.length != 0){
					for(j=0; j < json[i].entities.user_mentions.length; j++){
						user2.mentions.push(json[i].entities.user_mentions[j].screen_name);
					}
				}
				
				if(json[i].place){
					user2.locations.push(json[i].place.full_name);
				}
			}
			callCount++;
			compute();

		});
		
		
		//get followers
		$.getJSON('http://api.twitter.com/1/followers/ids.json?screen_name=' + user1.username + '&callback=?', function(json) {
			 				
			user1.followers = json.ids;
			callCount++;
			compute();
			 			
		});
		
		$.getJSON('http://api.twitter.com/1/followers/ids.json?screen_name=' + user2.username + '&callback=?', function(json) {
			 				
			user2.followers = json.ids;
			callCount++;
			compute();
			 			
		});
		
		//get following
		$.getJSON('http://api.twitter.com/1/following/ids.json?screen_name=' + user1.username + '&callback=?', function(json) {
			 				
			user1.following = json.ids;
			callCount++;
			compute();
			 			
		});
		
		$.getJSON('http://api.twitter.com/1/following/ids.json?screen_name=' + user2.username + '&callback=?', function(json) {
			 				
			user2.following = json.ids;
			callCount++;
			compute();
			 			
		});
		
	});
	
	function compute() {
		
		//check to see if all the getJSON calls have completed
		if(callCount >= 6){
			//get the shared attributes
			locations = _.intersection(user1.locations, user2.locations);
			followers = _.intersection(user1.followers, user2.followers);
			following = _.intersection(user1.following, user2.following);
			mentions = _.intersection(user1.mentions, user2.mentions);
			hashtags = _.intersection(user1.hashtags, user2.hashtags);

			//calculate the Jaccard scores and combine the five into one Jaccard Index 
			var jaccardLocations = locations.length / _.union(user1.locations, user2.locations).length;
			var jaccardFollowers = followers.length / _.union(user1.followers, user2.followers).length;
			var jaccardFollowing = following.length / _.union(user1.following, user2.following).length;
			var jaccardMentions = mentions.length / _.union(user1.mentions, user2.mentions).length;
			var jaccardHashtags = hashtags.length / _.union(user1.hashtags, user2.hashtags).length;

			jaccardIndex = int((jaccardLocations + jaccardFollowers + jaccardFollowing + jaccardMentions + jaccardHashtags) / 5 * 100);

			console.log(jaccardLocations);
			console.log(jaccardFollowers);
			console.log(jaccardFollowing);
			console.log(jaccardMentions);
			console.log(jaccardHashtags);
			
			var followerLookup = 'http://api.twitter.com/1/users/lookup.json?user_id=';
			var followingLookup = 'http://api.twitter.com/1/users/lookup.json?user_id=';
			
			for(var i = 0; i < followers.length; i++){
				
				followerLookup = followerLookup + followers[i] + ',' 
			}
			
			for(var i = 0; i < following.length; i++){
				
				followingLookup = followingLookup + following[i] + ',' 
			}
			
			followerLookup += '&callback=?';
			followingLookup += '&callback=?';
			
			$.getJSON(followerLookup, function(json){
				for(var i = 0; i < json.length; i++){
					followers[i]=json[i].screen_name;
				}
				
				$.getJSON(followingLookup, function(json){
					for(var i = 0; i < json.length; i++){
						following[i]=json[i].screen_name;
					}
					
					display();
				});
			});
		
		}//end of if(callCount)
		
	}//the end of function compute
	
	function display() {	
			
		//clear old tweets
		for(var i = 0; i < divID.length; i++){
			$(divID[i]).empty();
		}
			
		//fade out tweet container while we update the dom
		$('#contentContainer').fadeOut('fast', function() {
			//scroll back to top
			$('html, body').animate({ scrollTop: $('#formContainer').offset().top}, 1000);
			
			$('#compatabilityData').append('<li>' + jaccardIndex + '%' + '</li>');


			if(locations.length > 0){
				for (var i = 0; i < locations.length; i++){
					$('#locationData').append('<li>' + locations[i] + '</li>');
				}
			}
			else{
				$('#locationData').append('<li>No shared locations :(</li>');
			}
			
			if(mentions.length > 0){
				for (var i = 0; i < mentions.length; i++){
					$('#mentionData').append('<li>@' + mentions[i] + '</li>');
				}
			}
			else{
				$('#mentionData').append('<li>No shared mentions :(</li>');
			}
			
			if(hashtags.length > 0){
				for (var i = 0; i < hashtags.length; i++){
					$('#hashtagData').append('<li>#' + hashtags[i] + '</li>');
				}
			}
			else{
				$('#hashtagData').append('<li>No shared hashtags :(</li>');
			}
			
			if(followers.length > 0){
				for (var i = 0; i < followers.length; i++){
					$('#followersData').append('<li>' + followers[i] + '</li>');
				}
			}
			else{
				$('#followersData').append('<li>No shared followers :(</li>');
			}
				
			if(following.length > 0){
				for (var i = 0; i < following.length; i++){
					$('#followingData').append('<li>' + following[i] + '</li>');
				}
			}
			else{
				$('#followingData').append('<li>Not following any of the same users :(</li>');
			}
				
			$('#contentContainer').fadeIn('fast');
				
		});
			
		
	}
	
});
