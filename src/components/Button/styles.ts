import styled from 'styled-components/native';
import { RectButton } from 'react-native-gesture-handler';

export const Container = styled(RectButton)`
    /* width: 100%; tirar por causa do Form */
    height: 60px;
    background: #ff9000;
    border-radius: 10px;
    margin-top: 8px;

    align-items: center;
    justify-content: center;
`;

export const ButtonText = styled.Text`
    font-family: 'RobotoSlab-Medium';
    color: #312e38;
    font-size: 18px;
`;
