#!/bin/bash

## This will export the 20 PNG variations of the 3 SVG files
## And do it FAST with parallel processing

# Configuration
INKSCAPE="/c/Program Files/Inkscape/bin/inkscape.exe"
SVG_FILES=("logo.svg" "logo-h.svg" "logo-z.svg")
SIZES_ICON1=(16 32 48 64 96 128)
SIZES_ICON2=(16 32)
SIZES_ICON3=(16 32)

# Create light variant from dark original
create_light_variant() {
    local input_file="$1"
    local output_file="$2"

    # Swap black & white
    sed -e 's/#000000/#TEMP_COLOR/g' \
        -e 's/#000/#TEMP_COLOR/g' \
        -e 's/#FFFFFF/#000000/gI' \
        -e 's/#FFF/#000/gI' \
        -e 's/#TEMP_COLOR/#FFFFFF/g' \
        "$input_file" > "$output_file"
}

# Export with inkscape
export_png() {
    local input_svg="$1"
    local output_png="$2"
    local size="$3"
    local opt_param="$4"

    # Build argument list
    ARGS=("--export-type=png" "--export-filename=$output_png" "--export-width=$size")
    [ -n "$opt_param" ] && ARGS+=("$opt_param")
    ARGS+=("$input_svg")

    # Do actual export here
    "$INKSCAPE" "${ARGS[@]}" 2> /dev/null

    # Check if export succeeded
    if [ $? -ne 0 ] || [ ! -f "$output_png" ]; then
        echo "ERROR: Failed to export $output_png" >&2
        return 1
    fi

    echo "Success: $output_png"
    return 0
}

# Process each file
for i in "${!SVG_FILES[@]}"; do (
    svg_file="${SVG_FILES[$i]}"
    base_name="${svg_file%.svg}"

    # Get the appropriate sizes array for this SVG
    case $i in
        0) sizes=("${SIZES_ICON1[@]}") ;;
        1) sizes=("${SIZES_ICON2[@]}") ;;
        2) sizes=("${SIZES_ICON3[@]}") ;;
        *) sizes=("${SIZES_ICON1[@]}") ;; # Default to all sizes
    esac

    echo "Processing $svg_file with sizes: ${sizes[*]}"

    # Create temporary light variant SVG
    TEMP_LIGHT_SVG=$(mktemp --suffix=.svg)
    create_light_variant "$svg_file" "$TEMP_LIGHT_SVG"

    # Array to track background processes
    pids=()

    # Process each size
    for size in "${sizes[@]}"; do
        # Dark variant (original file)
        export_png "$svg_file" "${base_name}-${size}-dark.png" "$size" &
        pids+=($!)

        # Light variant (swapped colors)
        export_png "$TEMP_LIGHT_SVG" "${base_name}-${size}-light.png" "$size" &
        pids+=($!)

    done

    # Wait for all exports for this SVG to complete
    wait "${pids[@]}"

    # Cleanup temporary file
    rm -f "$TEMP_LIGHT_SVG"

    echo "Completed processing for $svg_file"
) & done

# And one special one for the placeholder
echo "Processing placeholder"
export_png "logo.svg" "placeholder.png" "16" "--export-background=#FFFFFF"

# Wait for all SVG processing to complete
wait

echo "All exports completed!"
