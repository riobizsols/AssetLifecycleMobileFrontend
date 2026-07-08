import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { UI_CONSTANTS } from '../utils/uiConstants';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export default function InlineDatePicker({ value, onChange, minimumDate, maximumDate }) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();

  const min = minimumDate ? new Date(minimumDate) : null;
  const max = maximumDate ? new Date(maximumDate) : null;

  const years = useMemo(() => {
    const startYear = min ? min.getFullYear() : new Date().getFullYear() - 1;
    const endYear = max ? max.getFullYear() : new Date().getFullYear() + 25;
    const list = [];
    for (let y = startYear; y <= endYear; y += 1) {
      list.push(y);
    }
    return list.length ? list : [year];
  }, [min, max, year]);

  const days = useMemo(() => {
    const count = daysInMonth(year, month);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [year, month]);

  const updateDate = (nextYear, nextMonth, nextDay) => {
    const maxDay = daysInMonth(nextYear, nextMonth);
    let safeDay = Math.min(Math.max(nextDay, 1), maxDay);
    let next = new Date(nextYear, nextMonth, safeDay, 12, 0, 0, 0);

    if (min && next < min) {
      next = new Date(min);
      next.setHours(12, 0, 0, 0);
    }
    if (max && next > max) {
      next = new Date(max);
      next.setHours(12, 0, 0, 0);
    }

    onChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={month}
          onValueChange={(m) => updateDate(year, m, day)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {MONTHS.map((label, index) => (
            <Picker.Item key={label} label={label} value={index} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={day}
          onValueChange={(d) => updateDate(year, month, d)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {days.map((d) => (
            <Picker.Item key={String(d)} label={String(d)} value={d} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={year}
          onValueChange={(y) => updateDate(y, month, day)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {years.map((y) => (
            <Picker.Item key={String(y)} label={String(y)} value={y} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    overflow: 'hidden',
  },
  pickerWrap: {
    flex: 1,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  pickerItem: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
});
