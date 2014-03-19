/*globals
	FB,
	console
*/
(function(){
	'use strict';
	window.Utilities = {
		showModal: function(modal){
			if(modal.classList.contains('fade')) {
				modal.classList.remove('fade');
				modal.style.display = 'block';
			}
		},
		hideModal: function(modal){
			if(!modal.classList.contains('fade')) {
				modal.classList.add('fade');
				modal.style.display = 'none';
			}
		}
	};

	document.onclick = function(evt) {
		var target = evt.target;
		if(target.getAttribute('data-dismiss') === 'modal') {
			while(target.getAttribute('role') !== 'dialog') {
				target = target.parentNode;
			}
			window.Utilities.hideModal(target);
		}
	};
}());

(function(){
	'use strict';
	window.SearchApp = (function() {
		var Model = {},
			View = {},
			Controller = {},
			Template = {},
			options = {
				appId: '',
				appSecret: '',
				accessTocken: ''
			},
			ajaxRequest = new XMLHttpRequest();

		Controller.enableSearchForm = function(){
			View.searchForm.querySelector('[type="submit"]').removeAttribute('disabled');
			View.searchInput.removeAttribute('disabled');
			View.alert.style.display = 'none';
		};

		Controller.generateAccessTocken = function() {
			var accessTockenUrl = 'https://graph.facebook.com/oauth/access_token?' +
									'client_id=' + options.appId +
									'&client_secret=' + options.appSecret +
									'&grant_type=client_credentials';

			ajaxRequest.open('GET', accessTockenUrl, true);
			ajaxRequest.onreadystatechange = function () {
				var index, tocken;
				if (ajaxRequest.readyState === 4 && ajaxRequest.status === 200) {
					index = ajaxRequest.responseText.indexOf('=');
					tocken = ajaxRequest.responseText.substr(index + 1);
					options.accessTocken = tocken;
					console.log('Access tocken : ' + options.accessTocken);
					Controller.enableSearchForm();
				}
			};
			ajaxRequest.send(null);
		};

		Controller.updateGridDetails = function () {
			View.searchDesc.innerHTML = 'Search results for "<strong>' + View.searchInput.value + '</strong>", <strong>' +
										Model.pages.length + '</strong> results found.';
		};

		Controller.search = function(evt) {
			evt.preventDefault();
			var searchString = View.searchInput.value;

			if(!options.accessTocken) {
				return;
			}
			Controller.searchPages(searchString);
		};

		Controller.updateGrid = function() {
			var container = View.gridContainer,
				recordsHTML = [],
				recordTemplate = Template.pageRecord,
				newRecord = '',
				records = Model.pages,
				i;
			
			for(i = 0; i < records.length; i++) {
				newRecord = recordTemplate;
				newRecord = newRecord.replace(/{{sno}}/g, i+1);
				newRecord = newRecord.replace(/{{name}}/g, records[i].name);
				newRecord = newRecord.replace(/{{category}}/g, records[i].category);
				newRecord = newRecord.replace(/{{id}}/g, records[i].id);
				recordsHTML.push(newRecord);
			}

			container.innerHTML = '';
			container.innerHTML = recordsHTML.join('');

		};

		Controller.searchPages = function(searchString) {
			var searchUrl = 'https://graph.facebook.com/search?type=page' +
							'&q='+ searchString +
							'&type=page' +
							'&access_token=' + options.accessTocken;

			ajaxRequest.open('GET', searchUrl, true);
			ajaxRequest.onreadystatechange = function () {
				var response;
				if (ajaxRequest.readyState === 4 && ajaxRequest.status === 200) {
					response = JSON.parse(ajaxRequest.responseText);
					Model.pages = response.data;
					//Model.pagingPrev = response.paging.prev;
					//Model.pagingNext = response.paging.next;
					Controller.updateGridDetails();
					Controller.updateGrid();
				}
			};
			ajaxRequest.send(null);
		};

		Controller.showPageDetailsModal = function(data){
			var modal = View.pageDetailsModal,
				recordsContainer = View.modalRecordsContainer,
				key,
				recordTemplate = Template.modalRecord,
				newRecord,
				recordsList = [],
				img = '<img src="{{pathurl}}"" height=120 />';

			// Adding the image first
			if(data.hasOwnProperty('cover')) {
				newRecord = recordTemplate;
				newRecord = newRecord.replace(/{{key}}/g, 'image');
				img = img.replace(/{{pathurl}}/g, data.cover.source);
				newRecord = newRecord.replace(/{{value}}/g, img);
				recordsList.push(newRecord);
			}

			for(key in data) {
				if(data.hasOwnProperty(key)) {
					if(key !== 'cover') {
						newRecord = recordTemplate;
						newRecord = newRecord.replace(/{{key}}/g, key);
					
						newRecord = newRecord.replace(/{{value}}/g, data[key]);
						recordsList.push(newRecord);
					}
					
				}
			}
			recordsContainer.innerHTML = '';
			recordsContainer.innerHTML = recordsList.join('');
			window.Utilities.showModal(modal);
		};
		Controller.showPageDetails = function(evt){
			var target = evt.target,
				pageId;
			
			if(!target.hasAttribute('data-page-id')) {
				return;
			}
			evt.preventDefault();
			pageId = target.getAttribute('data-page-id');
			FB.api(
				'/' + pageId,
				function (response) {
					console.log(response);
					if (response && !response.error) {
						console.log(response);
						Controller.showPageDetailsModal(response);
					}
				}
			);

		};

		var init = function(config) {
			options.appId = config.appId;
			options.appSecret = config.appSecret;
			Controller.generateAccessTocken();

			// Templates
			Template.pageRecord = document.querySelector('#template-page-record').innerHTML;
			Template.modalRecord = document.querySelector('#template-modal-record').innerHTML;

			// Views
			View.searchForm = document.querySelector('#search-form');
			View.searchInput = document.querySelector('#search-string');
			View.searchDesc = document.querySelector('#search-desc');
			View.gridContainer = document.querySelector('#results-table tbody');
			View.modalRecordsContainer = document.querySelector('#page-details-modal-records tbody');
			View.pageDetailsModal = document.querySelector('#page-details-modal');
			View.alert = document.querySelector('#alert');
			//Bindings
			View.searchForm.onsubmit = Controller.search;
			View.gridContainer.onclick = Controller.showPageDetails;
		};


		return {
			init: init,
			searchPage: Controller.searchPage
		};
	}()); // End of window.SearchApp

}()); // End of global wrapper