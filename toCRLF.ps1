# Define a function to convert files to CRLF line endings
function Convert-FilesToCRLF {
  param (
    [string]$path
  )

  # Get a list of all files in the directory
  $files = Get-ChildItem -Path $path | Where-Object { !$_.PSIsContainer }

  # Loop through each file in the directory
  foreach ($file in $files) {
    # Read the contents of the file
    $content = Get-Content $file.FullName -Raw

    # Replace all CRLF line endings back to LF
    $content = $content.Replace("`r`n", "`n")

    # Replace all LF line endings with CRLF line endings
    $content = $content.Replace("`n", "`r`n")

    # Write the modified content back to the file
    Set-Content -Path $file.FullName -Value $content
  }

  # Get a list of all subdirectories in the directory
  $subdirs = Get-ChildItem -Path $path | Where-Object { $_.PSIsContainer }

  # Loop through each subdirectory in the directory
  foreach ($subdir in $subdirs) {
    # Call the function recursively for the subdirectory
    Convert-FilesToCRLF -path $subdir.FullName
  }
}

# Set the path to the directory containing the files to be converted
$path = ".\"

# Call the function to convert files to CRLF line endings recursively
Convert-FilesToCRLF -path $path

# Output a message indicating that the conversion is complete
Write-Host "File conversion complete."
