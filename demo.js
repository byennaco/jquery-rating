$(document).ready(function() {

    function Payload(grade, gradeSum, numGrades, numNotInterested, avgtextID, notinttextID) {
	this.grade = grade;
	this.gradeSum = gradeSum;
	this.numGrades = numGrades;
	this.numNotInterested = numNotInterested;
        this.avgtextID = avgtextID;
        this.notinttextID = notinttextID;
    };

    $("#rating1Holder").rating({
        id: "rating1",
        autoSubmit: true,
        maxGrade: 5,
        inAverageMode: false,
        grade: 0,
        averageGrade: 0.0,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        notInterestedHoverText: "Not Interested",
        clearHoverText: "Clear Rating",
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext1", "notinttext1")
    });
    

    $("#rating2Holder").rating({
        id: "rating2",
        autoSubmit: true,
        maxGrade: 5,
        inAverageMode: true,
        grade: 0,
        averageGrade: 0,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        notInterestedHoverText: "Not Interested",
        clearHoverText: "Clear Rating",
        includeModeToggle: true,
        modeToggleHoverTexts: [   // Applies when includeToggleMode=true
            "Show user's rating",    // Displays when inAverageMode=true
            "Show average rating"    // Displays when inAverageMode=false
        ],
        notInterestedAcknowledgedText: "Sorry to hear",
        gradeAcknowledgedText: "Thank you!",
        clearAcknowledgedText: "Rating Cleared",
        modeToggleAcknowledgedTexts: [
                "Normal rating shown",
                "Average rating shown",
        ],
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext2", "notinttext2")
    });

    // Typically the data required to manage an average (sum of all grades, number of grades)
    // might come from a server.  For the sake of this example, apply some rating grade changes 
    // sufficient to yield a 2.5 average.  Each of these will trigger an event cycle that will
    // allow for calculations in the event handler.
    setTimeout(function() {
        $("#rating2Holder .Rating").rating({"grade": "2"});
    }, 100);
    setTimeout(function() {
        $("#rating2Holder .Rating").rating({"grade": "3"});
    }, 500);

    $("#rating3Holder").rating({
        id: "rating3",
        autoSubmit: true,
        maxGrade: 5,
        grade: 0,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        includeClear: false,
        includeNotInterested: false,
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext3", "notinttext3")
    });

    $("#rating4Holder").rating({
        id: "rating4",
        autoSubmit: true,
        maxGrade: 5,
        grade: 0,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        includeText: false,
        includeClear: false,
        includeNotInterested: false,
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext4", "notinttext4")
    });

    $("#rating5Holder").rating({
        id: "rating5",
        autoSubmit: true,
        maxGrade: 5,
        grade: -1,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        includeText: true,
        includeClear: true,
        includeNotInterested: true,
        includeModeToggle: true,
        notInterestedHoverText: "Not Interested",
        clearHoverText: "Clear Rating",
        modeToggleHoverTexts: [
            "Show user's rating",    // Displays when inAverageMode=true
            "Show average rating"    // Displays when inAverageMode=false
        ],
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext5", "notinttext5")
    });

    $("#rating6Holder").rating({
        id: "rating6",
        autoSubmit: true,
        maxGrade: 4,
        grade: 3,
        gradeHoverTexts: [
              "Average",
              "Good",
              "Better",
              "Best"
        ],
        includeText: true,
        includeClear: true,
        includeNotInterested: true,
        notInterestedHoverText: "Not Interested",
        clearHoverText: "Clear Rating",
	payload: new Payload(this.grade, 0, 0, (this.grade == -1) ? 1 : 0, "avgtext6", "notinttext6")
    });

    $("#rating7Holder").rating({
        id: "rating7",
        autoSubmit: true,
        maxGrade: 5,
        grade: 1,
        averageGrade: 0,
        gradeHoverTexts: [
            "Hate It",
            "Below Average",
            "Average",
            "Above Average",
            "Love It"
        ],
        includeModeToggle: true,
        gradeReadOnly: true,
        notInterestedHoverText: "Not Interested",
        clearHoverText: "Clear Rating",
	payload: new Payload(this.grade, 1, 1, (this.grade == -1) ? 1 : 0, "avgtext7", "notinttext7")
    });


    // Event handler for grade changes.
    $(document).on("gradechanged", ".Rating", function(event, id, grade, payload) {
        if (payload != null) {
            // Only if grade is changing
            if (payload.grade == grade) {
                return;
            }
            payload.grade = grade;

            // Not interested grade does not factor into average grade
            if (payload.grade == -1) {
                payload.numNotInterested++;
                $('#' + payload.notinttextID).html(payload.numNotInterested);
                return;
            }

            // Clear grade does not factor into average grade
            if (payload.grade == 0) {
                return;
            }

            payload.gradeSum += grade;
            payload.numGrades++;

            // Compute average grade, rounded to neaest .001
            var averageGrade = payload.gradeSum / payload.numGrades;
            averageGrade = (averageGrade * 1000) / 1000;

            // Update both the displayed average and the widget's average property.
            $('#' + payload.avgtextID).html(averageGrade);
            $(this).rating({"averageGrade": averageGrade});
        }
    });

});
