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
    col2 = col1 + 18
    col3 = col2 + 18
    
    .Cells(1, col1).Value = "Concentration of Blue"
    .Cells(1, col2).Value = "% blue form aB"
    .Cells(1, col3).Value = "% reduced aB"
    
    For well = 1 To 16
        .Cells(2, well + col1).Value = "Well " & well
        .Cells(2, well + col2).Value = "Well " & well
        .Cells(2, well + col3).Value = "Well " & well
    Next well
    
    For i = 1 To datapoints
        r = i + 2
        
        ' Times
        .Cells(r, col1).Value = "=Reduced!A" & i + 1
        .Cells(r, col2).Value = "=Reduced!A" & i + 1
        .Cells(r, col3).Value = "=Reduced!A" & i + 1
    
        For well = 1 To 16
            ' Concentration of Blue
            .Cells(r, well + col1).Value = "='Well " & well & "'!J" & i + 1
            
            ' % blue form aB
            col = Split(Columns(well + 1).Address, "$")(2)
            .Cells(r, well + col2).Value = "=(" & col & r & "/" & col & "4)*100"
            
            ' % reduced aB
            col = Split(Columns(well + 1 + 18).Address, "$")(2)
            .Cells(r, well + col3).Value = "=100-" & col & r
        Next well
    Next i

End With

Call OptimizeCode_End

End Sub
