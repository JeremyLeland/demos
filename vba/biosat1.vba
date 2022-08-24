Function getCol(ByVal index As Integer)
    getCol = Split(Columns(index).Address, "$")(2)
End Function

Sub createAnalysisSheet()

Call OptimizeCode_Begin

Dim sheet
Dim reduced

Set reduced = Sheets("Reduced")

Dim datapoints As Integer
datapoints = Cells(Sheets("Reduced").Rows.Count, 1).End(xlUp).Row


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

Call OptimizeCode_End

End Sub