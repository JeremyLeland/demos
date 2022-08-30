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

Set reduced = Sheets("Reduced")

datapoints = Cells(Sheets("Reduced").rows.Count, 1).End(xlUp).Row - 1   ' exclude header row

Set sheet = Sheets.Add(After:=Sheets(Sheets.Count))
sheet.Name = "Analysis"

With sheet
    col1 = 1
    col2 = col1 + 18    ' 16 well columns + some padding
    col3 = col2 + 18
    col4 = col3 + 18
    
    ' Top row labels
    .Cells(1, col1).Value = "Concentration of Blue"
    .Cells(1, col2).Value = "% blue form aB"
    .Cells(1, col3).Value = "% reduced aB"
    
    .Cells(1, col4 + 1).Value = "Averages"
    .Cells(1, col4 + 3).Value = "Std. Dev."
    
    ' 2nd row lables (wells and averages)
    For well = 1 To 16
        .Cells(2, well + col1).Value = "Well " & well
        .Cells(2, well + col2).Value = "Well " & well
        .Cells(2, well + col3).Value = "Well " & well
    Next well
    
    .Cells(2, col4 + 1).Value = "WT"
    .Cells(2, col4 + 2).Value = "rad51" & ChrW(&H394)    ' 0394 = delta symbol
    .Cells(2, col4 + 3).Value = "WT"
    .Cells(2, col4 + 4).Value = "rad51" & ChrW(&H394)    ' 0394 = delta symbol
    
    ' Rows of datapoints
    For i = 1 To datapoints
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
        For part = 0 To 1
            leftCol = getCol(part * 8 + 1 + col3)
            rightCol = getCol(part * 8 + 8 + col3)
            .Cells(r, col4 + part + 1).Value = "=AVERAGE(" & leftCol & r & ":" & rightCol & r & ")"
            .Cells(r, col4 + part + 3).Value = "=STDEV(" & leftCol & r & ":" & rightCol & r & ")"
        Next part
    Next i
End With

Chart = createChart(sheet:=sheet, left:=100, top:=100, yAxis:="%reduction aB", rows:=datapoints, xCol:="BC", seriesCol1:="BD", seriesCol2:="BE")

Call OptimizeCode_End

End Sub
