define([
    "dojo/_base/declare",
    "dojo/dom"
], function(declare, dom){
    return declare(null, {
        constructor: function(args) {
            var thisb = this;
            var browser = args.browser;
            //console.log("tabs constructor",args);
            
            browser.afterMilestone( 'initView', function() {

                // tab settings
                var tabs = {
                    selected: "#tab-track-select",
                    "#tab-track-select": {
                        panel: "#hierarchicalTrackPane",
                        show: function() {
                            $('#hierarchicalTrackPane > .dijitTitlePane').show();
                        },
                        hide: function() {
                            $('#hierarchicalTrackPane > .dijitTitlePane').hide();
                        }
                    },
                    "#tab-jblast-filter": {
                        panel: "#jblast-filter-panel",
                        show: function() {
                            $('#hierarchicalTrackPane > #blast-filter-group').show();
                        },
                        hide: function() {
                            $('#hierarchicalTrackPane > #blast-filter-group').hide();
                        }
                    }
                };
                
                // create the panel from template
                var tabsTemplate = $('#tabs-panel').html();
                $( tabsTemplate ).insertBefore( "#hierarchicalTrackPane" );

                // handle tab click (either tab)
                $('.jblast-tabs > li').on('click',function( event, param1, param2 ) {
                    if (tabs.selected === '#'+event.currentTarget.id) return; // already selected, skip
                    var lastSelected = tabs.selected;
                    tabs.selected = '#'+event.currentTarget.id;
                    //console.log("tab id",tabs.selected);
                    
                    (tabs[lastSelected].hide)();
                    (tabs[tabs.selected].show)();                    
                });

                // reposition the track selector panel when needed
                dojo.subscribe("/jbrowse/v1/n/tracks/redraw", function(track){
                    // handle offset fix of track select panel
                    $('#hierarchicalTrackPane').css('top','45px');
                });        
            });
        },
        processAction(plugin,browser) {

            var queue = browser.jblast.focusQueue;
            var task = queue.shift();
            browser.jblast.focusQueueProc++;

            if (task.action === 'show') {
                $('#blast-filter-group').clone().prependTo('#hierarchicalTrackPane');
                plugin.setupFilterSliders(task.trackConfig);
                //$('#blast-filter-group').show(500,function() {
                $('#blast-filter-group').show(0,function() {
                    $("#tab-jblast-filter").show();
                    $("#tab-jblast-filter > a").trigger('click');
                    $('.blast-group-descript').html(task.trackConfig.key);
                    if (typeof task.trackConfig.metadata != 'undefined' && typeof task.trackConfig.metadata.description !== 'undefined') {
                        $('.blast-group-descript').attr('title',task.trackConfig.metadata.description);
                        $('.blast-group-descript').attr('alt',task.trackConfig.metadata.description);

                        $.get("/service/exec/get_blastdata/?asset="+browser.jblast.asset+'&dataset='+encodeURIComponent(browser.config.dataRoot), function(data){
                            console.log( data );
                            $('.blast-hit-data').html("Hits: ("+data.filteredHits+'/'+data.hits+")");
                        });
                    }
                    browser.jblast.focusQueueProc--;
                });
            }
            else if (task.action === 'hide') {
                $("#hierarchicalTrackPane > #blast-filter-group").hide(100,function complete() {
                    $("#hierarchicalTrackPane > #blast-filter-group").remove();
                    $("#tab-jblast-filter").hide();
                    $("#tab-track-select > a").trigger('click');
                });
                if ($('#blast-filter-group').length) {
                    //$('#blast-filter-group').hide(500);
                    $('#blast-filter-group').hide();
                    setTimeout(function() { // hide complete event is broke in jquery, so we use a timer.
                        browser.jblast.focusQueueProc--;
                    },700);
                }
            }
        }
    });
});