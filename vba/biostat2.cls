' Combined original CLS with additional analysis functions

'
' ORIGINAL
'

Public CalcState As Long
Public EventState As Boolean
Public PageBreakState As Boolean

Sub OptimizeCode_Begin()

Application.ScreenUpdating = False

EventState = Application.EnableEvents
Application.EnableEvents = False

CalcState = Application.Calculation
Application.Calculation = xlCalculationManual

PageBreakState = ActiveSheet.DisplayPageBreaks
ActiveSheet.DisplayPageBreaks = False

End Sub


Sub OptimizeCode_End()

ActiveSheet.DisplayPageBreaks = PageBreakState
Application.Calculation = xlCalculationAutomatic
Application.EnableEvents = EventState
Application.ScreenUpdating = True

End Sub

'****************************************************************************************
'This macro can be used to open each csv file for each card, apply the processing sub
'flexabs (see below) and save it as a xlsx in a new folder. It then calls the sub summary,
'which looks through all the recently created files to generate parameter plots.
'In its current state, all files must be available in the specified folder, and the
'destination folder should be empty.
'You must change the file paths as necessary for this to work
'Note, the flexabs sub can be run on its own if you just have 1 csv file to run
'***************************************************************************

Sub copyRawData()

Call OptimizeCode_Begin
'Application.ScreenUpdating = False
 
Dim z As Integer

For z = 1 To 18
        'change file path if you are not Mike
    Set closedBook = Workbooks.Open("C:\Users\mpadgen\Desktop\Biosentinel\EVT\raw\Card_" & z & ".csv")
    closedBook.Sheets(1).Copy
    closedBook.Close savechanges:=False
        'change file path if you are not Mike
    ActiveWorkbook.SaveAs Filename:="C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\EVT Card " & z & ".xlsx", FileFormat:=51
    Call flexAbs
    ActiveWorkbook.Close savechanges:=True
Next z

Call OptimizeCode_Begin

Call summary

Call OptimizeCode_End
'Application.ScreenUpdating = True
End Sub



'*****************************************
'This macro takes a 10 point average of the raw data (Reduced), then rearranges the data for each well (Well i).
'The drift correct has been taken out because it seemed to cause more problems than it solved.
'The framework is still there to be able to add that in later if someone has a better idea.
'While this intially uses defined values of aB, it adjusts the starting values to eliminate negative values
'in the calculation of Blue and %Red
'*****************************************

Sub flexAbs()
'v1 as of 12/10/20
Dim datapoints As Integer
Dim i As Integer
Dim j As Integer
Dim k As Integer
Dim l As Integer
Dim myRange As Range
Dim colChar As Variant
Dim TestTitle As String
Dim aveRng As Double
'Dim stdRng As Double
Dim testVal As Double

Call OptimizeCode_Begin

Sheets(1).Name = "Raw Data"
Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Summary"

'This should get the file name not including the ".xlsx"
'Sheets("Summary").Cells(1, 1).Value = "=MID(CELL(""filename""),SEARCH(""["",CELL(""filename""))+1, SEARCH(""."",CELL(""filename""))-SEARCH(""["",CELL(""filename""))-1)"
'TestTitle = Sheets("Summary").Cells(1, 1).Value & " "



Sheets("Raw Data").activate
datapoints = ActiveSheet.Range("A" & ActiveSheet.rows.Count).End(xlUp).Row - 1

With Sheets("Raw Data")
    'GSE optics reader have no temp column, but flight boards do. So need an extra column here
    'for flight, going to assume t = 0 is in row 90
    .Cells(1, 56).Value = "=(Date(A90,B90,C90)+Time(D90,E90,F90))*24"
    For j = 1 To datapoints
        .Cells(j + 1, 56).Value = "=(Date(A" & j + 1 & ",B" & j + 1 & ",C" & j + 1 & ")+Time(D" & j + 1 & ",E" & j + 1 & ",F" & j + 1 & "))*24-$BD$1"
    Next j
End With

datapoints = Application.WorksheetFunction.RoundDown(datapoints / 10, 0) - 9
' want to change to remove outliers
'reducing to every 10 data points starting at t = 0
Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Reduced"

For j = 1 To datapoints
    With Sheets("Reduced")
        .Cells(j + 1, 1).Value = Sheets("Raw Data").Cells(j * 10 + 80, 56).Value
    End With
        
    For k = 1 To 48
        With Sheets("Raw Data")
            'GSE and flight columns are different by 1 (start at column 7/G 3*(i+1)+k for GSE, 8/H 3*(i+1)+k+1 for flight
            Set myRange = .Range(.Cells(10 * j + 80, k + 7), .Cells(10 * j + 89, k + 7))
                        'attempting to remove outliers, set up a range of 10 datapoints, if any point = 0 or is
                                                '3x average then it gets removed.
                        aveRng = Application.WorksheetFunction.Average(myRange)
                        For i = 1 To 10
                                testVal = .Cells(10 * j + 79 + i, k + 7).Value
                                If testVal > 3 * aveRng Then
                                        .Cells(10 * j + 79 + i, k + 7).Value = ""
                                ElseIf testVal = 0 Then
                                        .Cells(10 * j + 79 + i, k + 7).Value = ""
                                End If
                        Next i
        End With
        
        Sheets("Reduced").Cells(j + 1, k + 1).Value = Application.WorksheetFunction.Average(myRange)
    Next k
Next j

Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Diff"

For j = 1 To datapoints
    With Sheets("Diff")
        .Cells(j + 1, 1).Value = "='Reduced'!A" & j + 1
        
        For k = 1 To 48
            colChar = Split(Cells(1, k + 1).Address, "$")(1)
            Cells(j + 1, k + 1).Value = "='Reduced'!" & colChar & "$8-'Reduced'!" & colChar & j + 1
        Next k
    End With
Next j

Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Fit"
'blocking out fit to remove drift correct terms since it wasn't working that well, but structure
'in place in case a better solution is produced
' For k = 1 To 48
    ' With Sheets("Fit")
        ' colChar = Split(Cells(1, k + 1).Address, "$")(1)
        ' for l = 1 to 4
                        ' .Cells(k, l).Value = "=index(linest('Diff'!" & colChar & "8:" & colChar & "47,'Diff'!A8:A47^{1,2,3},true,false)," & l & ")"
                ' next l
        ' .Cells(k, 5).Value = "=A" & k & "*15^3+B" & k & "*15^2+C" & k & "*15+D" & k
    ' End With
' Next k

Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Hertz"

With Sheets("Hertz")
    For j = 1 To datapoints
        .Cells(j + 1, 1).Value = "='Reduced'!A" & j + 1
    Next j

    For j = 1 To 46
        For k = 1 To 48
            colChar = Split(Cells(1, k + 1).Address, "$")(1)
            Cells(j + 1, k + 1).Value = "='Reduced'!" & colChar & j + 1 & "+'Fit'!A" & k & "*A" & j + 1 & "^3+'Fit'!B" & k & "*A" & j + 1 & "^2+'Fit'!C" & k & "*A" & j + 1 & "+'Fit'!D" & k
        Next k
    Next j
    
    For j = 47 To datapoints
        For k = 1 To 48
            colChar = Split(Cells(1, k + 1).Address, "$")(1)
            Cells(j + 1, k + 1).Value = "='Reduced'!" & colChar & j + 1 & "+'Fit'!E" & k
        Next k
    Next j
End With

For k = 1 To 48
    Sheets("Reduced").Cells(1, k + 1).Value = Sheets("Raw Data").Cells(1, k + 7).Value
    Sheets("Diff").Cells(1, k + 1).Value = Sheets("Reduced").Cells(1, k + 1).Value
    Sheets("Hertz").Cells(1, k + 1).Value = Sheets("Reduced").Cells(1, k + 1).Value
Next k

For i = 1 To 16
    Sheets.Add(After:=Sheets(Sheets.Count)).Name = "Well " & i
    With Sheets("Well " & i)
        For k = 1 To 3
            .Cells(1, k + 1).Value = Sheets("Hertz").Cells(1, 3 * (i - 1) + k + 1).Value
        Next k
        
        For j = 1 To datapoints
            .Cells(j + 1, 1).Value = "='Hertz'!$A" & j + 1
        
            For k = 1 To 3
                colChar = Split(Cells(1, 3 * (i - 1) + k + 1).Address, "$")(1)
                .Cells(j + 1, k + 1).Value = "='Hertz'!" & colChar & j + 1
            Next k
        Next j
    End With
    
    Dim plotstart As Integer
    With Sheets("Well " & i)
        .Cells(8, 12).Value = "T = 2 hr"
        .Cells(8, 13).Value = "=match(2,a:a,1)+1"
        .Cells(8, 13).Name = "plotStart"
        plotstart = .Cells(8, 13).Value
        
    End With
    
        'freq plot
        Sheets("Well " & i).activate
 
        Dim charttitle As String
        Dim yAxis As String
        Dim chartName As String
        Dim numseries As Integer
        Dim hpos As Integer
        Dim vpos As Integer
        Dim colStart As Integer
        
        numseries = 3
        charttitle = TestTitle & "Well " & i & " Freq"
        chartName = "ChartHz"
        yAxis = "Freq (Hz)"
        hpos = 0
        vpos = 200
        colStart = 1
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
        Dim ch As Object
        
        Set ch = Sheets("Well " & i).ChartObjects("ChartHz").Chart
        
        With ch
            .SeriesCollection(1).Border.color = RGB(200, 0, 0)
            .SeriesCollection(2).Border.color = RGB(0, 150, 0)
            .SeriesCollection(3).Border.color = RGB(100, 100, 100)
        End With
                             
        
        
                'labels
        With Sheets("Well " & i)
            .Cells(1, 13).Value = "G"
            .Cells(1, 14).Value = "R"
            .Cells(1, 15).Value = "I"
            .Cells(2, 12).Value = "deltaf fraction"
            .Cells(3, 12).Value = "A0"
            .Cells(4, 12).Value = "f plotstart"
                        .Cells(5, 12).Value = "deltaf"
            
            'abs0 delta f
            .Cells(2, 13).Value = 0.008
            .Cells(2, 14).Value = 0.034
            .Cells(2, 15).Value = 0.01
            .Cells(3, 13).Value = 1.31
            .Cells(3, 14).Value = 0.51
            .Cells(3, 15).Value = 0
                        .Cells(4, 13).Value = "=indirect(""C"" & plotstart)"
            .Cells(4, 14).Value = "=indirect(""B"" & plotstart)"
            .Cells(4, 15).Value = "=indirect(""D"" & plotstart)"
                        .Cells(5, 13).Value = "=M2*M4"
            .Cells(5, 14).Value = "=N2*N4"
            .Cells(5, 15).Value = "=O2*O4"
            'constants
            .Cells(2, 17).Value = "R/IR"
            .Cells(2, 18).Value = 1.09
            .Cells(3, 17).Value = "G/IR"
            .Cells(3, 18).Value = 1.11
            .Cells(4, 17).Value = "Blue/Green"
            .Cells(4, 18).Value = "=M3/N3"
                        

            'converting freq to abs, then to blue and pink
            .Cells(1, 7).Value = "G_Abs"
            .Cells(1, 8).Value = "R_Abs"
            .Cells(1, 9).Value = "i_Abs"
            .Cells(1, 10).Value = "Blue"
            .Cells(1, 11).Value = "Pink"
            
            For j = 1 To datapoints
                    .Cells(j + 1, 7).Value = "=m$3+log(($m$4 - m$5)/(C" & j + 1 & "-m$5))"
                    .Cells(j + 1, 8).Value = "=N$3+log(($n$4 - n$5)/(B" & j + 1 & "-n$5))"
                    .Cells(j + 1, 9).Value = "=O$3+log(($o$4 - o$5)/(D" & j + 1 & "-o$5))"
                    .Cells(j + 1, 10).Value = "=(H" & j + 1 & "-$R$2*I" & j + 1 & ")*$R$4"
                    .Cells(j + 1, 11).Value = "=G" & j + 1 & "-$R$2*I" & j + 1 & "-J" & j + 1
            Next j
                
        End With
        
                'abs plot
               
        Sheets("Well " & i).activate

        charttitle = TestTitle & "Well " & i & " Abs"
        chartName = "ChartAbs"
        yAxis = "Abs"
        hpos = 290
        vpos = 200
        
        colStart = 6
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
       
        Set ch = Sheets("Well " & i).ChartObjects("ChartAbs").Chart
        With ch
            .SeriesCollection(1).Border.color = RGB(0, 150, 0)
            .SeriesCollection(2).Border.color = RGB(200, 0, 0)
            .SeriesCollection(3).Border.color = RGB(100, 100, 100)
         End With
                

                       
                'B/P/OD plot
        Sheets("Well " & i).activate
 
        charttitle = TestTitle & "Well " & i & " B/P/OD"
        chartName = "ChartBPOD"
        yAxis = "B/P/OD"
        hpos = 580
        vpos = 200
        colStart = 8
 
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
                       
        Set ch = Sheets("Well " & i).ChartObjects("ChartBPOD").Chart
                
        With ch
            .SeriesCollection(1).Border.color = RGB(100, 100, 100)
            .SeriesCollection(2).Border.color = RGB(0, 0, 200)
            .SeriesCollection(3).Border.color = RGB(231, 84, 128)
        End With

'for calc %reduced
Dim constA As Double
Dim constB As Double
Dim constC As Double
Dim constD As Double
        
constA = 34798
constB = 80586
constC = 155677
constD = 5494
        With Sheets("Well " & i)
            .Cells(1, 5).Value = "R-OD"
            .Cells(1, 6).Value = "%Reduced"
            For j = 1 To datapoints
                .Cells(j + 1, 5).Value = "=H" & j + 1 & "-I" & j + 1 & "*$R$2"
                .Cells(j + 1, 6).Value = "=(" & constA & "*(G" & j + 1 & "-I" & j + 1 & ")-" & constB & "*(H" & j + 1 & "-I" & j + 1 & "))/(" & constC & "*(H9-I9)-" & constD & "*(G9-I9))"
            Next j
        
'adjusting starting abs values to remove negative numbers
            .Cells(7, 14).Value = "Min R-OD"
            .Cells(8, 14).Value = "Min %red"
            .Cells(7, 15).Value = "=min(e:e)"
            .Cells(8, 15).Value = "=min(f:f)"
                        
        End With

                'percent reduced plot
        Sheets("Well " & i).activate
 
        charttitle = TestTitle & "Well " & i & " Percent Reduced"
        chartName = "ChartReduced"
        yAxis = "Percent reduced"
        hpos = 580
        vpos = 420
        colStart = 5
        numseries = 1
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
                       
        Set ch = Sheets("Well " & i).ChartObjects("ChartReduced").Chart
                
        With ch
            .SeriesCollection(1).Border.color = RGB(231, 84, 128)
        End With

        With Sheets("Well " & i)
                'labels
                .Cells(1, 21).Value = "dBlue/dt"
                .Cells(1, 22).Value = "dPink/dt"
                .Cells(1, 23).Value = "dOD/dt"
                .Cells(1, 24).Value = "%Reduced Rate"
                .Cells(1, 25).Value = "k1f1"
                .Cells(1, 26).Value = "k2f2"
                
                .Cells(6, 17).Value = "Parameters"
                .Cells(7, 17).Value = "Max Pink Value"
                .Cells(8, 17).Value = "Max Pink Time"
                .Cells(9, 17).Value = "Max Blue Rate"
                .Cells(10, 17).Value = "Max Pink App Rate"
                .Cells(11, 17).Value = "Max Pink Dis Rate"
                .Cells(12, 17).Value = "Max OD Rate"
                .Cells(13, 17).Value = "Max %Red Inc Rate"
                .Cells(14, 17).Value = "Max %Red Dec Rate"
                
                

                
                For j = 1 To datapoints - 3
                        .Cells(j + 3, 20).Value = "=A" & j + 3
                        .Cells(j + 3, 21).Value = "=(J" & j + 5 & "-J" & j + 1 & ")/($A" & j + 5 & "-$A" & j + 1 & ")"
                        .Cells(j + 3, 22).Value = "=(K" & j + 5 & "-K" & j + 1 & ")/($A" & j + 5 & "-$A" & j + 1 & ")"
                        .Cells(j + 3, 23).Value = "=(I" & j + 5 & "-I" & j + 1 & ")/($A" & j + 5 & "-$A" & j + 1 & ")"
                        .Cells(j + 3, 24).Value = "=(F" & j + 5 & "-F" & j + 1 & ")/($A" & j + 5 & "-$A" & j + 1 & ")"
                        .Cells(j + 3, 25).Value = "=-U" & j + 2 & "/J" & j + 2
                        .Cells(j + 3, 26).Value = "=(V" & j + 2 & "-U" & j + 2 & ")/K" & j + 2
                Next j
                
                'parameters
                .Cells(7, 18).Value = "=max(K:K)"
                .Cells(8, 18).Value = "=index(A:A,match(R7,K:K,0))"
                .Cells(9, 18).Value = "=min(U:U)"
                .Cells(10, 18).Value = "=max(V:V)"
                .Cells(11, 18).Value = "=min(V:V)"
                .Cells(12, 18).Value = "=max(W:W)"
                .Cells(13, 18).Value = "=max(X:X)"
                .Cells(14, 18).Value = "=min(X:X)"
                
                
                'average or not
                .Cells(11, 12).Value = "Good/Bad"
                .Cells(11, 13).Value = 1
                Range("M11").interior.ColorIndex = 44
                .Cells(12, 12).Value = "If ok, leave M11 as 1"
                .Cells(13, 12).Value = "If bad, change M11 to 0"
        End With
        
        'kinetics plots
        Sheets("Well " & i).activate

        charttitle = TestTitle & "Well " & i & " Rates"
        chartName = "ChartRate"
        yAxis = "ddt"
        hpos = 870
        vpos = 200
        colStart = 20
        numseries = 4
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
         
        Set ch = Sheets("Well " & i).ChartObjects("ChartRate").Chart
                
        With ch
            .SeriesCollection(1).Border.color = RGB(0, 0, 200)
            .SeriesCollection(2).Border.color = RGB(231, 84, 128)
            .SeriesCollection(3).Border.color = RGB(100, 100, 100)
            .SeriesCollection(4).Border.color = RGB(0, 0, 0)
        End With

        Sheets("Well " & i).activate
        
        numseries = 2
        charttitle = TestTitle & "Well " & i & " Kinetics"
        chartName = "ChartKinetics"
        yAxis = "k*f"
        hpos = 870
        vpos = 420
        colStart = 24
        
        Call scatterPlot(hpos, vpos, i, colStart, numseries, chartName, charttitle, yAxis, datapoints, plotstart)
        
        Set ch = Sheets("Well " & i).ChartObjects("ChartKinetics").Chart
            With ch
                    .SeriesCollection(1).Border.color = RGB(0, 0, 200)
                    .SeriesCollection(2).Border.color = RGB(231, 84, 128)
            End With

Next i


'summarizing parameters
With Sheets("Summary")
        
        
        For i = 1 To 16
                .Cells(1, i + 1).Value = "Well " & i
                For j = 1 To 8
                        .Cells(j + 1, i + 1).Value = "=if('Well " & i & "'!$M$11=0,"""",'Well " & i & "'!R" & j + 6 & ")"
                Next j
                .Cells(10, i + 1).Value = "=if('Well " & i & "'!$M$11=0,"""",'Well " & i & "'!$M$3)"
                .Cells(11, i + 1).Value = "=if('Well " & i & "'!$M$11=0,"""",'Well " & i & "'!$N$3)"
                .Cells(12, i + 1).Value = "=if('Well " & i & "'!$M$11=0,"""",'Well " & i & "'!$R$4)"

        Next i
        
        .Cells(1, 19).Value = "WT Ave"
        .Cells(1, 20).Value = "rad51 Ave"
        .Cells(1, 21).Value = "WT StDev"
        .Cells(1, 22).Value = "rad51 StDev"
        .Cells(1, 23).Value = "T-test"
        .Cells(1, 24).Value = "Significance"
        
        For j = 1 To 8
            .Cells(j + 1, 1).Value = "='Well 1'!Q" & j + 6
        Next j
            
        .Cells(10, 1).Value = "Blue 570 A0"
        .Cells(11, 1).Value = "Blue 630 A0"
        .Cells(12, 1).Value = "570/630 ratio"
            
        For j = 1 To 11
            .Cells(j + 1, 18).Value = "=A" & j + 1
            .Cells(j + 1, 19).Value = "=Abs(Average(B" & j + 1 & ":I" & j + 1 & "))"
            .Cells(j + 1, 20).Value = "=Abs(Average(J" & j + 1 & ":Q" & j + 1 & "))"
            .Cells(j + 1, 21).Value = "=StDev(B" & j + 1 & ":I" & j + 1 & ")"
            .Cells(j + 1, 22).Value = "=StDev(J" & j + 1 & ":Q" & j + 1 & ")"
            .Cells(j + 1, 23).Value = "=T.TEST(B" & j + 1 & ":I" & j + 1 & ",J" & j + 1 & ":Q" & j + 1 & ",2,3)"
            .Cells(j + 1, 24).Value = "=IF(W" & j + 1 & ">0.05,"""",IF(W" & j + 1 & ">0.01,""*"",IF(W" & j + 1 & ">0.001,""**"",IF(W" & j + 1 & ">0.0001,""***"",IF(W" & j + 1 & ">0.00001,""****"",""*****"")))))"
        Next j
        
        .Columns("A:A").Autofit
                .Columns("R:R").Autofit
End With

Sheets("Summary").activate
Dim plotRng As Range
Dim stdRange As Range
Dim ChartParamA As ChartObject
Dim ChartParamB As ChartObject
Dim ChartParamC As ChartObject
Dim ChartParamD As ChartObject


With Sheets("Summary")
    Set plotRng = .Range(.Cells(1, 18), .Cells(12, 20))
End With

Set ChartParamA = ActiveSheet.ChartObjects.Add(left:=10, width:=288, top:=195, Height:=216)
     With ChartParamA.Chart
        .ChartType = xlColumnClustered
        .HasTitle = True
        .charttitle.Text = TestTitle & "Parameters"
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        .Legend.Font.Size = 8
    End With
    
    With ChartParamA.Chart.Axes(xlValue)
        .HasTitle = True
        .AxisTitle.Caption = "ddt"
        .HasMajorGridlines = False
    End With
    
    ChartParamA.Chart.SetSourceData plotRng, xlColumns
    
    For i = 1 To 2
        With Sheets("Summary")
            Set stdRange = .Range(.Cells(2, 20 + i), .Cells(12, 20 + i))
        End With
        With ChartParamA.Chart.SeriesCollection(i)
                        .HasErrorBars = True
            .ErrorBar Direction:=xlY, Include:=xlErrorBarIncludeBoth, Type:=xlErrorBarTypeCustom, amount:=stdRange, minusvalues:=stdRange
        End With
    Next i

        ChartParamA.Chart.SeriesCollection(1).interior.color = RGB(136, 65, 157)
        ChartParamA.Chart.SeriesCollection(2).interior.color = RGB(227, 26, 38)
        
        
ChartParamA.Copy
Sheets("Summary").Paste

Set ChartParamB = Sheets("Summary").ChartObjects(2)

Sheets("Summary").Paste

Set ChartParamC = Sheets("Summary").ChartObjects(3)
 
Sheets("Summary").Paste

Set ChartParamD = Sheets("Summary").ChartObjects(4)

ChartParamA.activate
        For i = 1 To 10
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 1).IsFiltered = True
        Next i
        
ChartParamA.Chart.Axes(xlValue).AxisTitle.Caption = "[Pink]"
ChartParamA.width = 144


ChartParamB.activate
        ActiveChart.ChartGroups(1).FullCategoryCollection(1).IsFiltered = True
        For i = 1 To 9
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 2).IsFiltered = True
        Next i

ChartParamB.Chart.Axes(xlValue).AxisTitle.Caption = "Time (hr)"
With ChartParamB
    .width = 144
    .left = 160
        .top = 195
End With


ChartParamC.activate
    For i = 1 To 2
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    For i = 1 To 3
        ActiveChart.ChartGroups(1).FullCategoryCollection(i + 8).IsFiltered = True
    Next i
    
With ChartParamC
        .left = 320
        .top = 195
End With

ChartParamD.activate
    For i = 1 To 8
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    
With ChartParamD
        .left = 620
        .top = 195
End With
    
ChartParamD.Chart.Axes(xlValue).AxisTitle.Caption = "Abs"

With Sheets("Summary")
        .Cells(1, 25).Value = "WT n"
        .Cells(2, 25).Value = "=COUNT(B2:I2)"
        .Cells(1, 26).Value = "rad51 n"
        .Cells(2, 26).Value = "=COUNT(J2:Q2)"
End With
'plotting average b/p/od/%reduced


Call OptimizeCode_End

Dim minROD As Double
Dim minReduce As Double
Dim startRed As Double
Dim startGreen As Double

For i = 1 To 16
    With Sheets("Well " & i)
        minROD = .Cells(7, 15).Value
        startRed = .Cells(3, 14).Value
        startGreen = .Cells(3, 13).Value

        While minROD < 0
            startRed = startRed + 0.01
            .Cells(3, 14).Value = startRed
            minROD = .Cells(7, 15).Value
        Wend

        minReduce = .Cells(8, 15).Value
        
        While minReduce < 0
            startGreen = startGreen + 0.01
            .Cells(3, 13).Value = startGreen
            minReduce = .Cells(8, 15).Value
        Wend
    
    End With
Next i




Sheets("Summary").activate

End Sub


Sub scatterPlot(ByVal hpos As Integer, ByVal vpos As Integer, ByVal i As Integer, ByVal colStart As Integer, ByVal numseries As Integer, ByVal chartName As String, ByVal charttitle As String, ByVal yAxis As String, ByVal datapoints As Integer, ByVal plotstart As Integer)

Dim k As Integer
Dim ch As ChartObject
Dim xRng As Range
Dim CountsRng As Range
Dim column As Variant
Dim namestr As String


Set ch = ActiveSheet.ChartObjects.Add(left:=hpos, width:=288, top:=vpos, Height:=216)
    
With ch.Chart
        .ChartType = xlXYScatterSmoothNoMarkers
End With

With Sheets("Well " & i)
        Set xRng = .Range(.Cells(plotstart, 1), .Cells(datapoints + 1, 1))
End With


For k = 1 To numseries
        column = Split(Cells(1, k + colStart).Address, "$")(1)
        namestr = "='Well " & i & "'!" & column & "1"
        
        With Sheets("Well " & i)
                Set CountsRng = .Range(.Cells(plotstart, k + colStart), .Cells(datapoints + 1, k + colStart))
        End With
    
        With ch.Chart.SeriesCollection.NewSeries
                .Name = namestr
                .XValues = xRng
                .Values = CountsRng
        End With
    
Next k

With ch.Chart
        .HasTitle = True
        .charttitle.Text = charttitle
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        .Legend.Font.Size = 8
End With
    
With ch.Chart.Axes(xlCategory)
        .HasTitle = True
        .AxisTitle.Caption = "Time (h)"
        .HasMajorGridlines = False
End With

With ch.Chart.Axes(xlValue)
        .HasTitle = True
        .AxisTitle.Caption = yAxis
        .HasMajorGridlines = False
End With

ch.Name = chartName

End Sub

'************************************************************
'This sub looks at all 18 card files and extracts the average and stdev
'of each of the identified parameters. It plots them by card and then
'by group.
'The file paths are specific and need to be changed. There is probably
'a better way to do this, but that can wait until later.
'************************************************************

Sub summary()
Dim i As Integer
Dim j As Integer
Dim k As Integer
Dim newBook As Workbook

Set newBook = Workbooks.Add(xlWBATWorksheet)
        'change file path if you are not Mike
newBook.SaveAs Filename:="C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\summary.xlsx", FileFormat:=51

With newBook.Sheets(1)
    For i = 1 To 9
        .Cells(1, i + 1).Value = "Card " & 10 - i
    Next i
    .Cells(1, 11).Value = "Card 10"
    For i = 1 To 8
        .Cells(1, 11 + i).Value = "Card " & 19 - i
    Next i


    .Cells(2, 1).Value = "WT Max Pink Value"
    .Cells(3, 1).Value = "rad51 Max Pink Value"
    .Cells(4, 1).Value = "WT Max Pink Time"
    .Cells(5, 1).Value = "rad51 Max Pink Time"
    .Cells(6, 1).Value = "WT Max Blue Rate"
    .Cells(7, 1).Value = "rad51 Max Blue Rate"
    .Cells(8, 1).Value = "WT Max Pink App Rate"
    .Cells(9, 1).Value = "rad51 Max Pink App Rate"
    .Cells(10, 1).Value = "WT Max Pink Dis Rate"
    .Cells(11, 1).Value = "rad51 Max Pink Dis Rate"
    .Cells(12, 1).Value = "WT Max OD Rate"
    .Cells(13, 1).Value = "rad51 Max OD Rate"
    .Cells(14, 1).Value = "WT Max %Red Inc Rate"
    .Cells(15, 1).Value = "rad51 Max %Red Inc Rate"
    .Cells(16, 1).Value = "WT Max %Red Dec Rate"
    .Cells(17, 1).Value = "rad51 Max %Red Dec Rate"
    .Cells(18, 1).Value = "WT Blue 570 A0"
    .Cells(19, 1).Value = "rad51 Blue 570 A0"
        .Cells(20, 1).Value = "WT Blue 630 A0"
    .Cells(21, 1).Value = "rad51 Blue 630 A0"
        .Cells(22, 1).Value = "WT 570/630 ratio"
    .Cells(23, 1).Value = "rad51 570/630 ratio"
        .Cells(24, 1).Value = "WT n"
        .Cells(25, 1).Value = "rad51 n"
        
                                        'change file paths for all steps in these loops if you are not Mike
    For i = 1 To 11
        For j = 1 To 2
            For k = 1 To 9
                If j = 1 Then
                    .Cells(2 * (i - 1) + j + 1, k + 1).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$S$" & i + 1
                    .Cells(2 * (i - 1) + j + 1, k + 20).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$U$" & i + 1
                Else
                    .Cells(2 * (i - 1) + j + 1, k + 1).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$T$" & i + 1
                    .Cells(2 * (i - 1) + j + 1, k + 20).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$V$" & i + 1
                End If
            Next k
            If j = 1 Then
                .Cells(2 * (i - 1) + j + 1, 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$S$" & i + 1
                .Cells(2 * (i - 1) + j + 1, 30).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$U$" & i + 1
            Else
                .Cells(2 * (i - 1) + j + 1, 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$T$" & i + 1
                .Cells(2 * (i - 1) + j + 1, 30).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$V$" & i + 1
            End If
            
            For k = 1 To 8
                If j = 1 Then
                    .Cells(2 * (i - 1) + j + 1, k + 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$S$" & i + 1
                    .Cells(2 * (i - 1) + j + 1, k + 30).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$U$" & i + 1
                Else
                    .Cells(2 * (i - 1) + j + 1, k + 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$T$" & i + 1
                    .Cells(2 * (i - 1) + j + 1, k + 30).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$V$" & i + 1
                End If
            Next k
        Next j
    Next i

        For j = 1 To 2
            For k = 1 To 9
                If j = 1 Then
                    .Cells(24, k + 1).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$Y$2"
                Else
                    .Cells(25, k + 1).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 10 - k & ".xlsx]Summary'!$Z$2"
                    
                End If
            Next k
            
                        If j = 1 Then
                .Cells(24, 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$Y$2"
                
            Else
                .Cells(25, 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card 10.xlsx]Summary'!$Z$2"
               
            End If
            
            For k = 1 To 8
                If j = 1 Then
                    .Cells(24, k + 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$Y$2"
                    
                Else
                    .Cells(25, k + 11).Value = "='C:\Users\mpadgen\Desktop\Biosentinel\EVT\processed\[EVT card " & 19 - k & ".xlsx]Summary'!$Z$2"
                   
                End If
            Next k
        Next j

Dim colA As Variant
Dim colB As Variant
Dim colC As Variant
Dim colD As Variant


    For i = 1 To 9
        .Cells(30, i + 1).Value = "Group " & i
        colA = Split(Cells(1, 2 * i).Address, "$")(1)
        colB = Split(Cells(1, 2 * i + 1).Address, "$")(1)
        colC = Split(Cells(1, 2 * i + 19).Address, "$")(1)
        colD = Split(Cells(1, 2 * i + 20).Address, "$")(1)
        
        
        For j = 1 To 11
            .Cells(29 + 2 * j, i + 1).Value = "=(" & colA & 2 * j & "*" & colA & "24+" & colB & 2 * j & "*" & colB & "24)/(" & colA & "24+" & colB & "24)"
            .Cells(30 + 2 * j, i + 1).Value = "=(" & colA & 2 * j + 1 & "*" & colA & "25+" & colB & 2 * j + 1 & "*" & colB & "25)/(" & colA & "25+" & colB & "25)"
            .Cells(29 + 2 * j, i + 11).Value = "=(" & colC & 2 * j & "*" & colA & "24+" & colD & 2 * j & "*" & colB & "24)/(" & colA & "24+" & colB & "24)"
            .Cells(30 + 2 * j, i + 11).Value = "=(" & colC & 2 * j + 1 & "*" & colA & "25+" & colD & 2 * j + 1 & "*" & colB & "25)/(" & colA & "25+" & colB & "25)"
        
        Next j
    Next i
    For j = 1 To 22
        .Cells(30 + j, 1).Value = "=A" & j + 1
    Next j
        
End With

'plotting by card and group

Dim sumplotRng As Range
Dim sumstdRange As Range
Dim sumParamA As ChartObject
Dim sumParamB As ChartObject
Dim sumParamC As ChartObject
Dim sumParamD As ChartObject
Dim sumParamE As ChartObject
Dim sumParamF As ChartObject
Dim groupplotRng As Range
Dim groupstdRange As Range
Dim groupParamA As ChartObject
Dim groupParamB As ChartObject
Dim groupParamC As ChartObject
Dim groupParamD As ChartObject
Dim groupParamE As ChartObject
Dim groupParamF As ChartObject

With Sheets(1)
    Set sumplotRng = .Range(.Cells(1, 1), .Cells(23, 19))
End With

Set sumParamA = ActiveSheet.ChartObjects.Add(left:=0, width:=288, top:=0, Height:=216)
     With sumParamA.Chart
        .ChartType = xlColumnClustered
        .HasTitle = True
        .charttitle.Text = "EVT Parameters"
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        .Legend.Font.Size = 8
    End With
    
    With sumParamA.Chart.Axes(xlValue)
        .HasTitle = True
        .AxisTitle.Caption = "ddt"
        .HasMajorGridlines = False
    End With
    
    sumParamA.Chart.SetSourceData sumplotRng, xlColumns
    
    For i = 1 To 18
        With Sheets(1)
            Set sumstdRange = .Range(.Cells(2, 20 + i), .Cells(23, 20 + i))
        End With
        With sumParamA.Chart.SeriesCollection(i)
                        .HasErrorBars = True
            .ErrorBar Direction:=xlY, Include:=xlErrorBarIncludeBoth, Type:=xlErrorBarTypeCustom, amount:=sumstdRange, minusvalues:=sumstdRange
        End With
    Next i
        
        sumParamA.activate
    For j = 1 To 18
        For i = 1 To 11
            With ActiveChart.SeriesCollection(j).Points(2 * i - 1).Format.Fill
                .ForeColor.RGB = RGB(136, 65, 157)
                .Transparency = 0.03 * (j - 1)
            End With
            With ActiveChart.SeriesCollection(j).Points(2 * i).Format.Fill
                .ForeColor.RGB = RGB(227, 26, 38)
                .Transparency = 0.03 * (j - 1)
            End With
        Next i
    Next j
        
        
sumParamA.Copy
Sheets(1).Paste

Set sumParamB = Sheets(1).ChartObjects(2)

Sheets(1).Paste

Set sumParamC = Sheets(1).ChartObjects(3)
 
Sheets(1).Paste

Set sumParamD = Sheets(1).ChartObjects(4)

Sheets(1).Paste

Set sumParamE = Sheets(1).ChartObjects(5)

Sheets(1).Paste

Set sumParamF = Sheets(1).ChartObjects(6)

sumParamA.activate
        For i = 1 To 20
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 2).IsFiltered = True
        Next i
        
sumParamA.Chart.Axes(xlValue).AxisTitle.Caption = "[Pink]"



sumParamB.activate
        For i = 1 To 2
                        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
                Next i
        For i = 1 To 18
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 4).IsFiltered = True
        Next i

sumParamB.Chart.Axes(xlValue).AxisTitle.Caption = "Time (hr)"
With sumParamB
    .left = 290
        .top = 0
End With


sumParamC.activate
    For i = 1 To 4
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    For i = 1 To 12
        ActiveChart.ChartGroups(1).FullCategoryCollection(i + 10).IsFiltered = True
    Next i
    
With sumParamC
        .left = 580
                .top = 0
                .width = 576
End With

sumParamD.activate
    For i = 1 To 10
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
                ActiveChart.ChartGroups(1).FullCategoryCollection(i + 12).IsFiltered = True
    Next i
    
With sumParamD
      .left = 0
          .top = 220
End With
    

sumParamE.activate
    For i = 1 To 12
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    For i = 1 To 6
        ActiveChart.ChartGroups(1).FullCategoryCollection(i + 16).IsFiltered = True
    Next i
    
With sumParamE
        .left = 290
                .width = 432
                .top = 220
End With

sumParamF.activate
    For i = 1 To 16
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    
With sumParamF
        .left = 724
                .top = 220
                .width = 576
End With
    
sumParamF.Chart.Axes(xlValue).AxisTitle.Caption = "Abs"

'group graphing
With Sheets(1)
    Set groupplotRng = .Range(.Cells(30, 1), .Cells(52, 10))
End With

Set groupParamA = ActiveSheet.ChartObjects.Add(left:=0, width:=216, top:=440, Height:=216)
     With groupParamA.Chart
        .ChartType = xlColumnClustered
        .HasTitle = True
        .charttitle.Text = "EVT Parameters by Group"
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        .Legend.Font.Size = 8
    End With
    
    With groupParamA.Chart.Axes(xlValue)
        .HasTitle = True
        .AxisTitle.Caption = "ddt"
        .HasMajorGridlines = False
    End With
    
    groupParamA.Chart.SetSourceData groupplotRng, xlColumns
    
    For i = 1 To 9
        With Sheets(1)
            Set groupstdRange = .Range(.Cells(31, 11 + i), .Cells(52, 11 + i))
        End With
        With groupParamA.Chart.SeriesCollection(i)
                        .HasErrorBars = True
            .ErrorBar Direction:=xlY, Include:=xlErrorBarIncludeBoth, Type:=xlErrorBarTypeCustom, amount:=groupstdRange, minusvalues:=groupstdRange
        End With
    Next i
        
        groupParamA.activate
    For j = 1 To 9
        For i = 1 To 11
            With ActiveChart.SeriesCollection(j).Points(2 * i - 1).Format.Fill
                .ForeColor.RGB = RGB(136, 65, 157)
                .Transparency = 0.06 * (j - 1)
            End With
            With ActiveChart.SeriesCollection(j).Points(2 * i).Format.Fill
                .ForeColor.RGB = RGB(227, 26, 38)
                .Transparency = 0.06 * (j - 1)
            End With
        Next i
    Next j
        
        
groupParamA.Copy
Sheets(1).Paste

Set groupParamB = Sheets(1).ChartObjects(8)

Sheets(1).Paste

Set groupParamC = Sheets(1).ChartObjects(9)
 
Sheets(1).Paste

Set groupParamD = Sheets(1).ChartObjects(10)

Sheets(1).Paste

Set groupParamE = Sheets(1).ChartObjects(11)

Sheets(1).Paste

Set groupParamF = Sheets(1).ChartObjects(12)

groupParamA.activate
        For i = 1 To 20
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 2).IsFiltered = True
        Next i
        
groupParamA.Chart.Axes(xlValue).AxisTitle.Caption = "[Pink]"



groupParamB.activate
        For i = 1 To 2
                        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
                Next i
        For i = 1 To 18
            ActiveChart.ChartGroups(1).FullCategoryCollection(i + 4).IsFiltered = True
        Next i

groupParamB.Chart.Axes(xlValue).AxisTitle.Caption = "Time (hr)"
With groupParamB
    .left = 220
        .top = 440
End With


groupParamC.activate
    For i = 1 To 4
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    For i = 1 To 12
        ActiveChart.ChartGroups(1).FullCategoryCollection(i + 10).IsFiltered = True
    Next i
    
With groupParamC
        .left = 440
                .top = 440
                .width = 360
End With

groupParamD.activate
    For i = 1 To 10
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
                ActiveChart.ChartGroups(1).FullCategoryCollection(i + 12).IsFiltered = True
    Next i
    
With groupParamD
      .left = 0
          .top = 660
End With
    

groupParamE.activate
    For i = 1 To 12
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    For i = 1 To 6
        ActiveChart.ChartGroups(1).FullCategoryCollection(i + 16).IsFiltered = True
    Next i
    
With groupParamE
        .left = 220
                .width = 288
                .top = 660
End With

groupParamF.activate
    For i = 1 To 16
        ActiveChart.ChartGroups(1).FullCategoryCollection(i).IsFiltered = True
    Next i
    
With groupParamF
        .left = 512
                .top = 660
                .width = 360
End With
    
groupParamF.Chart.Axes(xlValue).AxisTitle.Caption = "Abs"

newBook.Save

End Sub


'
' Analysis
'
Function getCol(ByVal index As Integer) As String
    getCol = Split(Columns(index).Address, "$")(2)
End Function

Function createChart(ByVal sheet As Worksheet, ByVal left As Integer, ByVal top As Integer, ByVal yAxis As String, ByVal rows As Integer, ByVal xCol As String, ByVal seriesCol1 As String, ByVal seriesCol2 As String)
    Set cht = sheet.ChartObjects.Add(left:=left, width:=288, top:=top, Height:=216)
    cht.Chart.ChartType = xlXYScatterLines
    
    With cht.Chart
        .HasTitle = True
        .charttitle.Text = "card"
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
    End With
        
    With cht.Chart.Axes(xlCategory)
        .HasTitle = True
        .AxisTitle.Caption = "Time (hours)"
    End With
    
    With cht.Chart.Axes(xlValue)
        .HasTitle = True
        .AxisTitle.Caption = yAxis
    End With
    
    startRow = 4
    lastRow = startRow + rows
    
    With cht.Chart.SeriesCollection.NewSeries
        .Name = "WT"
        .XValues = sheet.Range(xCol & startRow & ":" & xCol & lastRow)
        .Values = sheet.Range(seriesCol1 & startRow & ":" & seriesCol1 & lastRow)
    End With
    
    With cht.Chart.SeriesCollection.NewSeries
        .Name = "rad51" & ChrW(&H394)    ' 0394 = delta symbol
        .XValues = sheet.Range(xCol & startRow & ":" & xCol & lastRow)
        .Values = sheet.Range(seriesCol2 & startRow & ":" & seriesCol2 & lastRow)
    End With
End Function

Sub createAnalysisSheet()

  Call OptimizeCode_Begin

  numPoints = Sheets("Reduced").UsedRange.Rows.Count - 1   ' exclude header row

  Set sheet = Sheets.Add(After:=Sheets(Sheets.Count))
  sheet.Name = "Analysis"

  With sheet
      col1 = 1
      col2 = col1 + 18    ' 16 well columns + some padding
      col3 = col2 + 18
      col4 = col3 + 18
      col5 = col4 + 5
      
      ' Top row labels
      .Cells(1, col1).Value = "Concentration of Blue"
      .Cells(1, col2).Value = "% blue form aB"
      .Cells(1, col3).Value = "% reduced aB"
      
      .Cells(1, col4 + 1).Value = "Averages"
      .Cells(1, col4 + 3).Value = "Std. Dev."
      
      .Cells(1, col5 + 1).Value = "Well Control Panel"
      
      ' 2nd row lables (wells and averages)
      For well = 1 To 16
          .Cells(2, well + col1).Value = "Well " & well
          .Cells(2, well + col2).Value = "Well " & well
          .Cells(2, well + col3).Value = "Well " & well
          
          .Cells(2, well + col5).Value = well
          .Cells(3, well + col5).Value = IIf(well <> 5, 1, 0)
          .Cells(3, well + col5).ColumnWidth = 4
      Next well
      
      .Cells(2, col4 + 1).Value = "WT"
      .Cells(2, col4 + 2).Value = "rad51" & ChrW(&H394)    ' 0394 = delta symbol
      .Cells(2, col4 + 3).Value = "WT"
      .Cells(2, col4 + 4).Value = "rad51" & ChrW(&H394)    ' 0394 = delta symbol
      
      ' Rows of datapoints
      For i = 1 To numPoints
          r = i + 2
          
          ' Times
          .Cells(r, col1).Value = "=Reduced!A" & i + 1
          .Cells(r, col2).Value = "=A" & i + 1
          .Cells(r, col3).Value = "=A" & i + 1
          .Cells(r, col4).Value = "=A" & i + 1
      
          ' Wells
          For well = 1 To 16
              ' Concentration of Blue
              .Cells(r, well + col1).Value = "='Well " & well & "'!J" & i + 1
              
              ' % blue form aB
              col = getCol(well + col1)
              .Cells(r, well + col2).Value = "=(" & col & r & "/" & col & "4)*100"
              
              ' % reduced aB
              col = getCol(well + col2)
              .Cells(r, well + col3).Value = "=100-" & col & r
          Next well
          
          ' WT is first 8 wells, rad51 is last 8 wells
          rangeWT = getCol(col3 + 1) & r & ":" & getCol(col3 + 8) & r
          rangeRad51 = getCol(col3 + 9) & r & ":" & getCol(col3 + 16) & r
          
          controlWT = getCol(col5 + 1) & 3 & ":" & getCol(col5 + 8) & 3
          controlRad51 = getCol(col5 + 9) & 3 & ":" & getCol(col5 + 16) & 3
          
          .Cells(r, col4 + 1).FormulaArray = "=AVERAGE(IF(" & controlWT & "=1," & rangeWT & "))"
          .Cells(r, col4 + 2).FormulaArray = "=AVERAGE(IF(" & controlRad51 & "=1," & rangeRad51 & "))"
          .Cells(r, col4 + 3).FormulaArray = "=STDEV(IF(" & controlWT & "=1," & rangeWT & "))"
          .Cells(r, col4 + 4).FormulaArray = "=STDEV(IF(" & controlRad51 & "=1," & rangeRad51 & "))"
      Next i
  End With

  Chart = createChart(sheet:=sheet, left:=3200, top:=100, yAxis:="%reduction aB", rows:=numPoints, xCol:="BC", seriesCol1:="BD", seriesCol2:="BE")

  Call OptimizeCode_End

End Sub

Sub createGrowthSheet()
    Call OptimizeCode_Begin

    numPoints = Sheets("Reduced").UsedRange.rows.Count - 1   ' exclude header row
    
    Set sheet = Sheets.Add(After:=Sheets(Sheets.Count))
    sheet.Name = "Growth"

    With sheet
        col1 = 1
        col2 = col1 + 18    ' 16 well columns + some padding
        
        ' Top row labels
        .Cells(1, col1).Value = "Growth"
        
        ' 2nd row lables (wells and growth)
        For well = 1 To 16
            .Cells(2, well + col1).Value = "Well " & well
        Next well
        
        ' Rows of datapoints
        For i = 1 To numPoints
            r = i + 2
            
            ' Times
            .Cells(r, col1).Value = "=Reduced!A" & i + 1
        
            ' Wells
            For well = 1 To 16
                ' Growth
                .Cells(r, well + col1).Value = "='Well " & well & "'!I" & i + 1
            Next well
        Next i
    End With
    
    For r = 1 To 4
        For c = 1 To 4
        
            wellNum = (r - 1) * 4 + c
    
            Set cht = sheet.ChartObjects.Add(left:=900 + (c - 1) * 255, width:=250, top:=5 + (r - 1) * 155, height:=150)
            cht.Chart.ChartType = xlXYScatterLines
            
            With cht.Chart
                .HasTitle = True
                .charttitle.Text = "Well " & wellNum
                .HasLegend = False
            End With
                
            With cht.Chart.Axes(xlCategory)
                .HasTitle = True
                .AxisTitle.Caption = "Time (hours)"
            End With
            
            With cht.Chart.Axes(xlValue)
                .HasTitle = True
                .AxisTitle.Caption = yAxis
                .MinimumScale = 0
                .MaximumScale = 1.5
            End With
            
            startRow = 3
            lastRow = startRow + numPoints
            
            wellCol = getCol(col1 + wellNum)
            
            With cht.Chart.SeriesCollection.NewSeries
                .Name = "Growth"
                .XValues = sheet.Range("A" & startRow & ":" & "A" & lastRow)
                .Values = sheet.Range(wellCol & startRow & ":" & wellCol & lastRow)
            End With
    
        Next c
    Next r
    
    Call OptimizeCode_End
End Sub

Sub fixGround()

    Call OptimizeCode_Begin

    Set srcSheet = Sheets(1)
    
    srcSheet.Copy Before:=srcSheet       ' place it before so flexAbs() can find it
    Set fixedSheet = Sheets(1)
    fixedSheet.Name = "Fixed"
    
    fixedSheet.Range("G1").EntireColumn.Insert  ' extra column for time
    
    numPoints = fixedSheet.UsedRange.rows.Count - 1    ' exclude header row
    
    colMax = 16 * 3 + 7
    
    For i = 1 To numPoints
        r = i + 1
        
        For col = 8 To colMax
            oldVal = fixedSheet.Cells(r, col).Value
            If oldVal > 0 Then
                newVal = 128000000 / oldVal
                fixedSheet.Cells(r, col).Value = newVal
            End If
        Next col
    Next i
    
    Call OptimizeCode_End
    
End Sub

Sub doEverything()

  Call flexAbs
  Call createGrowthSheet
  Call createAnalysisSheet

End Sub
